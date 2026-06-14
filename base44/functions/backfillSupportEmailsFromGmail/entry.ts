import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * backfillSupportEmailsFromGmail — for support Threads that currently have NO
 * EmailMessages, search the Gmail mailbox for conversations with the contact's
 * email and import any matching messages as EmailMessages, then backfill the
 * thread's gmail_thread_id / last_activity_at / snippet.
 *
 * Payload: { dry_run?, max_threads = 15 }
 *  - dry_run: only report what WOULD be imported, create nothing.
 *  - max_threads: how many threads to process per invocation (resumable).
 *
 * Idempotent: skips messages whose gmail_message_id already exists, and only
 * processes threads that have zero EmailMessages.
 *
 * Admin-only.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { dry_run = false, max_threads = 15 } = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;

    // 1) Load all support threads
    const threads = await db.Thread.filter({ source_app: 'support' }, '-last_activity_at', 2000);

    // 2) Determine which threads already have at least one EmailMessage
    const allEmails = await db.EmailMessage.list('-created_date', 5000);
    const threadsWithEmail = new Set(allEmails.map((e) => e.ticket_id));
    const existingMsgIds = new Set(allEmails.map((e) => e.gmail_message_id).filter(Boolean));

    // Candidates: emailless support threads with a contact email
    const candidates = threads.filter(
      (t) => !threadsWithEmail.has(t.id) && (t.contact_email || '').trim()
    );

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const summary = {
      total_support_threads: threads.length,
      emailless_candidates: candidates.length,
      threads_processed: 0,
      threads_matched: 0,
      messages_imported: 0,
      dry_run,
    };
    const details = [];

    const batch = candidates.slice(0, max_threads);

    for (const thread of batch) {
      summary.threads_processed++;
      const email = thread.contact_email.trim().toLowerCase();

      // Gmail search: any message to/from this contact
      const q = encodeURIComponent(`from:${email} OR to:${email}`);
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=25`,
        { headers: authHeader }
      );
      if (!listRes.ok) { details.push({ thread: thread.id, email, error: 'search_failed' }); continue; }
      const listJson = await listRes.json();
      const msgRefs = listJson.messages || [];
      if (!msgRefs.length) { details.push({ thread: thread.id, email, matched: 0 }); continue; }

      let importedForThread = 0;
      let gmailThreadId = thread.gmail_thread_id || '';
      let latestIso = thread.last_activity_at || '';
      let latestSnippet = thread.snippet || '';

      for (const ref of msgRefs) {
        if (existingMsgIds.has(ref.id)) continue;
        const mRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
          { headers: authHeader }
        );
        if (!mRes.ok) continue;
        const msg = await mRes.json();
        const headers = msg.payload?.headers || [];
        const labelIds = msg.labelIds || [];
        const from = parseEmail(getHeader(headers, 'From'));
        const to = parseEmail(getHeader(headers, 'To'));
        const subject = getHeader(headers, 'Subject');
        const rfcMessageId = getHeader(headers, 'Message-ID');
        const inReplyTo = getHeader(headers, 'In-Reply-To');
        const references = getHeader(headers, 'References');
        const dateHeader = getHeader(headers, 'Date');
        const { html, text } = extractBodies(msg.payload);
        const snippet = (msg.snippet || text || html.replace(/<[^>]+>/g, '')).slice(0, 200);
        const isOutbound = labelIds.includes('SENT');
        const sentIso = msg.internalDate
          ? new Date(Number(msg.internalDate)).toISOString()
          : (dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString());

        if (!dry_run) {
          await db.EmailMessage.create({
            ticket_id: thread.id,
            gmail_thread_id: msg.threadId || '',
            gmail_message_id: ref.id,
            rfc_message_id: rfcMessageId,
            in_reply_to: inReplyTo,
            references,
            direction: isOutbound ? 'outbound' : 'inbound',
            from_email: from.email,
            from_name: from.name,
            to_email: isOutbound ? to.email : email,
            subject,
            body_html: html,
            body_text: text,
            snippet,
            sent_at: sentIso,
            send_status: isOutbound ? 'sent' : 'received',
          });
          await sleep(150);
        }

        existingMsgIds.add(ref.id);
        importedForThread++;
        summary.messages_imported++;
        if (!gmailThreadId) gmailThreadId = msg.threadId || '';
        if (sentIso > latestIso) { latestIso = sentIso; latestSnippet = snippet; }
      }

      if (importedForThread > 0) {
        summary.threads_matched++;
        if (!dry_run) {
          await db.Thread.update(thread.id, {
            gmail_thread_id: gmailThreadId || thread.gmail_thread_id || '',
            last_activity_at: latestIso || thread.last_activity_at,
            snippet: latestSnippet || thread.snippet,
          });
          await sleep(150);
        }
      }
      details.push({ thread: thread.id, email, imported: importedForThread });
    }

    const done = batch.length >= candidates.length;
    return Response.json({ success: true, done, summary, details });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});