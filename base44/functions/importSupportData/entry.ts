import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * importSupportData — one-time migration of pip-support data into the Unified Inbox.
 *
 * Payload: { tickets_url, emails_url, dry_run? }
 *  - tickets_url: CSV export of SupportTicket
 *  - emails_url:  CSV export of EmailMessage
 *
 * Steps:
 *  1. Parse both CSVs.
 *  2. Upsert a Contact per unique client_email.
 *  3. Create a Thread per ticket (storing source_ticket_id = original ticket id).
 *  4. Re-link & create EmailMessage rows, mapping old ticket_id -> new thread id.
 *
 * Admin-only.
 */

// --- Minimal RFC-4180 CSV parser (handles quoted fields, commas, newlines) ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function toObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter((r) => r.length > 1)
    .map((r) => {
      const o = {};
      headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
      return o;
    });
}

function safeJSON(str, fallback) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// pip-support status -> unified Thread status
const STATUS_MAP = {
  'New': 'open',
  'In Progress': 'in_progress',
  'Waiting': 'waiting',
  'Resolved': 'resolved',
  'Closed': 'closed',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tickets_url, emails_url, dry_run, max_ops = 60 } = await req.json();
    if (!tickets_url || !emails_url) {
      return Response.json({ error: 'Missing tickets_url or emails_url' }, { status: 400 });
    }
    let ops = 0; // operations performed this invocation (capped by max_ops)

    const [tText, eText] = await Promise.all([
      fetch(tickets_url).then((r) => r.text()),
      fetch(emails_url).then((r) => r.text()),
    ]);

    const tickets = toObjects(parseCSV(tText));
    const emails = toObjects(parseCSV(eText));

    const db = base44.asServiceRole.entities;

    // --- 1. Build contact map from tickets (dedupe by lowercased email) ---
    const contactByEmail = {};
    for (const t of tickets) {
      const email = (t.client_email || '').trim().toLowerCase();
      if (!email) continue;
      if (!contactByEmail[email]) {
        contactByEmail[email] = {
          name: t.client_name || email,
          email,
          phone: t.client_phone || '',
          last_activity_at: t.updated_date || t.created_date || new Date().toISOString(),
        };
      }
    }

    const summary = {
      tickets_parsed: tickets.length,
      emails_parsed: emails.length,
      unique_contacts: Object.keys(contactByEmail).length,
      contacts_created: 0,
      threads_created: 0,
      emails_created: 0,
    };

    if (dry_run) {
      return Response.json({ dry_run: true, summary });
    }

    // Load existing contacts once to avoid duplicates
    const existingContacts = await db.Contact.list('-created_date', 2000);
    const existingByEmail = {};
    existingContacts.forEach((c) => { if (c.email) existingByEmail[c.email.toLowerCase()] = c; });

    // Create/resolve contacts
    const contactIdByEmail = {};
    for (const email of Object.keys(contactByEmail)) {
      if (existingByEmail[email]) {
        contactIdByEmail[email] = existingByEmail[email].id;
        continue;
      }
      const c = await db.Contact.create({ ...contactByEmail[email], labels: [] });
      contactIdByEmail[email] = c.id;
      summary.contacts_created++;
      ops++;
      await sleep(250);
      if (ops >= max_ops) {
        return Response.json({ success: true, phase: 'contacts', done: false, summary });
      }
    }

    // Pre-load existing imported threads so we can resume without duplicating
    const existingThreads = await db.Thread.filter({ source_app: 'support' }, '-created_date', 2000);
    const threadByOldId = {};
    existingThreads.forEach((t) => { if (t.source_ticket_id) threadByOldId[t.source_ticket_id] = t; });

    // --- 2. Create Threads, mapping old ticket id -> new thread id ---
    const threadIdByOldTicket = {};
    for (const t of tickets) {
      const email = (t.client_email || '').trim().toLowerCase();
      if (!email) continue;
      // Resume: skip tickets already imported
      if (threadByOldId[t.id]) {
        threadIdByOldTicket[t.id] = { id: threadByOldId[t.id].id, gmail_thread_id: threadByOldId[t.id].gmail_thread_id || '' };
        continue;
      }
      const history = safeJSON(t.status_history, []).map((h) => ({
        status: STATUS_MAP[h.status] || 'open',
        changed_by: 'imported',
        timestamp: h.timestamp,
      }));
      const subject = `${t.inquiry_type || 'Inquiry'} - ${t.client_name || email}`;
      const thread = await db.Thread.create({
        contact_id: contactIdByEmail[email],
        contact_email: email,
        contact_name: t.client_name || email,
        source_app: 'support',
        subject,
        snippet: (t.notes || t.cancellation_feedback || subject).toString().slice(0, 140),
        status: STATUS_MAP[t.status] || 'open',
        assignee_email: t.assigned_to || '',
        ticket_number: t.ticket_number ? Number(t.ticket_number) : undefined,
        source_ticket_id: t.id,
        last_activity_at: t.updated_date || t.created_date || new Date().toISOString(),
        is_read: true,
        form_data: {
          inquiry_type: t.inquiry_type,
          priority: t.priority,
          notes: t.notes,
          cancellation_reason: t.cancellation_reason,
          cancellation_feedback: t.cancellation_feedback,
          cancellation_satisfaction: t.cancellation_satisfaction,
          discount_offered: t.discount_offered,
          discount_accepted: t.discount_accepted,
        },
        status_history: history,
      });
      threadIdByOldTicket[t.id] = { id: thread.id, gmail_thread_id: '' };
      summary.threads_created++;
      ops++;
      await sleep(250);
      if (ops >= max_ops) {
        return Response.json({ success: true, phase: 'threads', done: false, summary });
      }
    }

    // Pre-load existing imported emails to resume without duplicating
    const existingEmails = await db.EmailMessage.list('-created_date', 3000);
    const existingMsgIds = new Set(existingEmails.map((e) => e.gmail_message_id).filter(Boolean));

    // --- 3. Create EmailMessages linked to new threads ---
    // Sort by sent_at ascending so threading reads naturally
    emails.sort((a, b) => (a.sent_at || '').localeCompare(b.sent_at || ''));
    const gmailThreadByTicket = {};
    for (const m of emails) {
      const mapped = threadIdByOldTicket[m.ticket_id];
      if (!mapped) continue; // skip emails whose ticket wasn't imported
      if (m.gmail_message_id && existingMsgIds.has(m.gmail_message_id)) continue; // resume
      await db.EmailMessage.create({
        ticket_id: mapped.id,
        gmail_thread_id: m.gmail_thread_id || '',
        gmail_message_id: m.gmail_message_id || '',
        rfc_message_id: m.rfc_message_id || '',
        in_reply_to: m.in_reply_to || '',
        references: m.references || '',
        direction: m.direction === 'inbound' ? 'inbound' : 'outbound',
        from_email: m.from_email || '',
        from_name: m.from_name || '',
        to_email: m.to_email || '',
        subject: m.subject || '',
        body_html: m.body_html || '',
        body_text: m.body_text || '',
        snippet: m.snippet || '',
        sent_by: m.sent_by || '',
        sent_at: m.sent_at || m.created_date || '',
        is_welcome: m.is_welcome === 'true',
        send_status: m.send_status || 'received',
        read_by: safeJSON(m.read_by, []),
      });
      summary.emails_created++;
      ops++;
      // Track the gmail_thread_id + root rfc id for the thread
      if (m.gmail_thread_id && !gmailThreadByTicket[m.ticket_id]) {
        gmailThreadByTicket[m.ticket_id] = {
          gmail_thread_id: m.gmail_thread_id,
          root: m.is_welcome === 'true' ? m.rfc_message_id : '',
        };
      } else if (m.gmail_thread_id && gmailThreadByTicket[m.ticket_id] && !gmailThreadByTicket[m.ticket_id].root && m.is_welcome === 'true') {
        gmailThreadByTicket[m.ticket_id].root = m.rfc_message_id;
      }
      await sleep(250);
      if (ops >= max_ops) {
        return Response.json({ success: true, phase: 'emails', done: false, summary });
      }
    }

    // --- 4. Backfill gmail_thread_id + root message id onto threads ---
    // Scan ALL imported EmailMessages (by new thread id) so backfill is complete
    // regardless of which batch created them.
    const allEmails = existingEmails.concat(
      emails.filter((m) => m.gmail_message_id && !existingMsgIds.has(m.gmail_message_id) && threadIdByOldTicket[m.ticket_id])
        .map((m) => ({ ticket_id: threadIdByOldTicket[m.ticket_id].id, gmail_thread_id: m.gmail_thread_id, is_welcome: m.is_welcome === 'true', rfc_message_id: m.rfc_message_id }))
    );
    const infoByThread = {};
    for (const m of allEmails) {
      if (!m.gmail_thread_id) continue;
      const cur = infoByThread[m.ticket_id];
      if (!cur) infoByThread[m.ticket_id] = { gtid: m.gmail_thread_id, root: m.is_welcome ? m.rfc_message_id : '' };
      else if (!cur.root && m.is_welcome) cur.root = m.rfc_message_id;
    }
    const threadsToFix = existingThreads.filter((t) => {
      const info = infoByThread[t.id];
      return info && info.gtid && t.gmail_thread_id !== info.gtid;
    });
    let fixed = 0;
    for (const t of threadsToFix) {
      if (ops >= max_ops) {
        return Response.json({ success: true, phase: 'backfill', done: false, summary: { ...summary, backfilled: fixed } });
      }
      const info = infoByThread[t.id];
      await db.Thread.update(t.id, { gmail_thread_id: info.gtid, gmail_root_message_id: info.root || t.gmail_root_message_id || '' });
      fixed++; ops++;
      await sleep(250);
    }

    return Response.json({ success: true, done: true, summary: { ...summary, backfilled: fixed } });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});