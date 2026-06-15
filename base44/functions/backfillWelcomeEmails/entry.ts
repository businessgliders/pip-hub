import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * backfillWelcomeEmails — imports the outbound "welcome / initial" email that the
 * spoke apps (pip-support, pip-events, ...) send to the submitter on form
 * submission, attaching it as the FIRST message of the matching hub Thread.
 *
 * How it works:
 *  - For each Thread without a welcome message yet, search the connected Gmail
 *    mailbox for SENT mail to the contact whose subject carries the welcome /
 *    threading tag ([Ticket #N] for support, [Request #N] for events).
 *  - Imports the earliest such message as an outbound EmailMessage (is_welcome).
 *
 * Idempotent: skips threads that already have an is_welcome message, and skips
 * messages whose gmail_message_id is already stored.
 *
 * Auth: admin user (manual run) OR no user (scheduled automation runner).
 * Payload: { dry_run?, max_threads = 25, source_app? }
 */

function getHeader(headers, name) {
  const h = (headers || []).find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

function parseEmail(raw) {
  const m = (raw || '').match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: '', email: (raw || '').trim().toLowerCase() };
}

function decodeBase64Url(data) {
  if (!data) return '';
  const norm = data.replace(/-/g, '+').replace(/_/g, '/');
  try { return decodeURIComponent(escape(atob(norm))); }
  catch (_) { try { return atob(norm); } catch (_) { return ''; } }
}

function extractBodies(payload) {
  let html = '', text = '';
  const walk = (part) => {
    if (!part) return;
    const mime = part.mimeType || '';
    if (mime === 'text/html' && part.body?.data) html += decodeBase64Url(part.body.data);
    else if (mime === 'text/plain' && part.body?.data) text += decodeBase64Url(part.body.data);
    if (Array.isArray(part.parts)) part.parts.forEach(walk);
  };
  walk(payload);
  return { html, text };
}

// The spoke welcome emails carry these threading tags in the subject.
const WELCOME_TAG = /\[(?:Ticket|Request)\s*#\d+\]/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow admins (manual) or the scheduler (no authenticated user).
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { dry_run = false, max_threads = 25, source_app, recent_minutes } = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;

    // Threads to consider — optionally limited to one inbox.
    const threadFilter = source_app ? { source_app } : {};
    let threads = await db.Thread.filter(threadFilter, '-last_activity_at', 3000);

    // For scheduled runs, only look at recently-created threads so we don't
    // re-scan hundreds of historical leads (whose welcome was never in this box).
    if (recent_minutes) {
      const cutoff = new Date(Date.now() - Number(recent_minutes) * 60 * 1000).toISOString();
      threads = threads.filter((t) => (t.created_date || '') >= cutoff);
    }

    // Which threads already have a welcome message?
    const allEmails = await db.EmailMessage.list('-created_date', 8000);
    const welcomeThreadIds = new Set(allEmails.filter((e) => e.is_welcome).map((e) => e.ticket_id));
    const existingMsgIds = new Set(allEmails.map((e) => e.gmail_message_id).filter(Boolean));

    const candidates = threads.filter(
      (t) => !welcomeThreadIds.has(t.id) && (t.contact_email || '').trim()
    );

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const summary = {
      total_threads: threads.length,
      candidates: candidates.length,
      threads_processed: 0,
      welcomes_imported: 0,
      dry_run,
    };
    const details = [];
    const batch = candidates.slice(0, max_threads);

    for (const thread of batch) {
      summary.threads_processed++;
      const email = thread.contact_email.trim().toLowerCase();

      // Find SENT mail to this contact (the welcome was sent to them).
      const q = encodeURIComponent(`to:${email} in:sent`);
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=25`,
        { headers: authHeader }
      );
      if (!listRes.ok) { details.push({ thread: thread.id, email, error: 'search_failed' }); continue; }
      const msgRefs = (await listRes.json()).messages || [];
      if (!msgRefs.length) { details.push({ thread: thread.id, email, matched: 0 }); continue; }

      // Fetch candidates, keep welcome-tagged ones, choose the earliest.
      let best = null;
      for (const ref of msgRefs) {
        const mRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
          { headers: authHeader }
        );
        if (!mRes.ok) continue;
        const msg = await mRes.json();
        const headers = msg.payload?.headers || [];
        const subject = getHeader(headers, 'Subject');
        if (!WELCOME_TAG.test(subject)) continue;
        const ts = msg.internalDate ? Number(msg.internalDate) : 0;
        if (!best || ts < best.ts) best = { ref, msg, headers, subject, ts };
        await sleep(80);
      }

      if (!best) { details.push({ thread: thread.id, email, matched: 0 }); continue; }
      if (existingMsgIds.has(best.ref.id)) {
        // Already imported (e.g. by support backfill) — just flag it as welcome.
        if (!dry_run) {
          const rows = await db.EmailMessage.filter({ gmail_message_id: best.ref.id }, '-created_date', 1);
          if (rows.length && !rows[0].is_welcome) await db.EmailMessage.update(rows[0].id, { is_welcome: true });
        }
        details.push({ thread: thread.id, email, flagged_existing: true });
        continue;
      }

      const from = parseEmail(getHeader(best.headers, 'From'));
      const { html, text } = extractBodies(best.msg.payload);
      const snippet = (best.msg.snippet || text || html.replace(/<[^>]+>/g, '')).slice(0, 200);
      const sentIso = new Date(best.ts || Date.now()).toISOString();

      if (!dry_run) {
        await db.EmailMessage.create({
          ticket_id: thread.id,
          gmail_thread_id: best.msg.threadId || '',
          gmail_message_id: best.ref.id,
          rfc_message_id: getHeader(best.headers, 'Message-ID'),
          in_reply_to: '',
          references: getHeader(best.headers, 'References'),
          direction: 'outbound',
          from_email: from.email,
          from_name: from.name,
          to_email: email,
          subject: best.subject,
          body_html: html,
          body_text: text,
          snippet,
          sent_by: 'system',
          sent_at: sentIso,
          is_welcome: true,
          send_status: 'sent',
        });
        // Only set fields that are missing — never push activity time backward.
        const patch = {};
        if (!thread.gmail_thread_id && best.msg.threadId) patch.gmail_thread_id = best.msg.threadId;
        if (!thread.last_activity_at) patch.last_activity_at = sentIso;
        if (!thread.snippet) patch.snippet = snippet;
        if (Object.keys(patch).length) await db.Thread.update(thread.id, patch);
        await sleep(120);
      }

      existingMsgIds.add(best.ref.id);
      summary.welcomes_imported++;
      details.push({ thread: thread.id, email, imported: true });
    }

    const done = batch.length >= candidates.length;
    return Response.json({ success: true, done, summary, details });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});