import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * importInfluencerData — one-time migration of pip-influencer (formerly partner)
 * data into the Unified Inbox.
 *
 * Payload: { requests_url, emails_url, dry_run?, max_ops? }
 *  - requests_url: CSV export of InfluencerApplication
 *  - emails_url:   CSV export of EmailMessage (filtered to ticket_type === "InfluencerApplication")
 *
 * Resumable & idempotent (skips threads by source_ticket_id, emails by gmail_message_id).
 * Admin-only.
 */

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
  return rows.slice(1).filter((r) => r.length > 1).map((r) => {
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

// pip-influencer status -> unified Thread status
const STATUS_MAP = {
  'pending': 'open',
  'reviewing': 'in_progress',
  'approved': 'resolved',
  'active': 'resolved',
  'declined': 'closed',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requests_url, emails_url, dry_run, max_ops = 60 } = await req.json();
    if (!requests_url || !emails_url) {
      return Response.json({ error: 'Missing requests_url or emails_url' }, { status: 400 });
    }
    let ops = 0;

    const [rText, eText] = await Promise.all([
      fetch(requests_url).then((r) => r.text()),
      fetch(emails_url).then((r) => r.text()),
    ]);
    const requests = toObjects(parseCSV(rText));
    // Only keep email rows for influencer applications
    const emails = toObjects(parseCSV(eText)).filter(
      (m) => (m.ticket_type || '').trim() === 'InfluencerApplication'
    );
    const db = base44.asServiceRole.entities;

    // --- 1. Build contact map (dedupe by lowercased email) ---
    const contactByEmail = {};
    for (const t of requests) {
      const email = (t.email || '').trim().toLowerCase();
      if (!email) continue;
      if (!contactByEmail[email]) {
        contactByEmail[email] = {
          name: (t.full_name || email).trim(),
          email,
          last_activity_at: t.updated_date || t.created_date || new Date().toISOString(),
        };
      }
    }

    const summary = {
      requests_parsed: requests.length,
      emails_parsed: emails.length,
      unique_contacts: Object.keys(contactByEmail).length,
      contacts_created: 0,
      threads_created: 0,
      emails_created: 0,
    };
    if (dry_run) return Response.json({ dry_run: true, summary });

    // Resolve/create contacts
    const existingContacts = await db.Contact.list('-created_date', 5000);
    const existingByEmail = {};
    existingContacts.forEach((c) => { if (c.email) existingByEmail[c.email.toLowerCase()] = c; });

    const contactIdByEmail = {};
    for (const email of Object.keys(contactByEmail)) {
      if (existingByEmail[email]) { contactIdByEmail[email] = existingByEmail[email].id; continue; }
      const c = await db.Contact.create({ ...contactByEmail[email], labels: [] });
      contactIdByEmail[email] = c.id;
      summary.contacts_created++; ops++;
      await sleep(250);
      if (ops >= max_ops) return Response.json({ success: true, phase: 'contacts', done: false, summary });
    }

    // Resume: existing influencer threads keyed by source_ticket_id
    const existingThreads = await db.Thread.filter({ source_app: 'influencer' }, '-created_date', 5000);
    const threadByOldId = {};
    existingThreads.forEach((t) => { if (t.source_ticket_id) threadByOldId[t.source_ticket_id] = t; });

    // --- 2. Create Threads ---
    const threadIdByOldTicket = {};
    for (const t of requests) {
      const email = (t.email || '').trim().toLowerCase();
      if (!email) continue;
      if (threadByOldId[t.id]) { threadIdByOldTicket[t.id] = threadByOldId[t.id].id; continue; }

      const history = safeJSON(t.status_history, []).map((h) => ({
        status: STATUS_MAP[h.status] || 'open',
        changed_by: h.by_name || 'imported',
        timestamp: h.timestamp,
      }));
      const subject = `Influencer Application - ${t.full_name || email}`;
      const thread = await db.Thread.create({
        contact_id: contactIdByEmail[email],
        contact_email: email,
        contact_name: (t.full_name || email).trim(),
        source_app: 'influencer',
        subject,
        snippet: (t.why_partner || subject).toString().slice(0, 140),
        status: STATUS_MAP[t.status] || 'open',
        ticket_number: t.display_ticket_number ? Number(t.display_ticket_number) : undefined,
        source_ticket_id: t.id,
        last_activity_at: t.updated_date || t.created_date || new Date().toISOString(),
        is_read: true,
        form_data: {
          full_name: t.full_name,
          instagram_handle: t.instagram_handle,
          tiktok_handle: t.tiktok_handle,
          follower_count: t.follower_count,
          content_style: t.content_style,
          location: t.location,
          why_partner: t.why_partner,
          priority: t.priority,
          internal_notes: safeJSON(t.internal_notes, []),
          original_status: t.status,
          app_number: t.app_number,
        },
        status_history: history,
      });
      threadIdByOldTicket[t.id] = thread.id;
      summary.threads_created++; ops++;
      await sleep(250);
      if (ops >= max_ops) return Response.json({ success: true, phase: 'threads', done: false, summary });
    }

    // Resume: existing emails by gmail_message_id
    const existingEmails = await db.EmailMessage.list('-created_date', 6000);
    const existingMsgIds = new Set(existingEmails.map((e) => e.gmail_message_id).filter(Boolean));

    // --- 3. Create EmailMessages linked to new threads ---
    emails.sort((a, b) => (a.sent_at || '').localeCompare(b.sent_at || ''));
    for (const m of emails) {
      const mappedId = threadIdByOldTicket[m.ticket_id];
      if (!mappedId) continue;
      if (m.gmail_message_id && existingMsgIds.has(m.gmail_message_id)) continue;
      await db.EmailMessage.create({
        ticket_id: mappedId,
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
      summary.emails_created++; ops++;
      await sleep(250);
      if (ops >= max_ops) return Response.json({ success: true, phase: 'emails', done: false, summary });
    }

    // Backfill gmail thread ids onto threads from their emails (for reply threading)
    const threadIds = Object.values(threadIdByOldTicket);
    for (const tid of threadIds) {
      const msgs = await db.EmailMessage.filter({ ticket_id: tid }, 'sent_at', 1);
      if (msgs[0] && msgs[0].gmail_thread_id) {
        const th = existingThreads.find((x) => x.id === tid);
        if (!th || !th.gmail_thread_id) {
          await db.Thread.update(tid, {
            gmail_thread_id: msgs[0].gmail_thread_id,
            gmail_root_message_id: msgs[0].rfc_message_id || '',
          });
          ops++;
          if (ops >= max_ops) return Response.json({ success: true, phase: 'backfill', done: false, summary });
        }
      }
    }

    return Response.json({ success: true, done: true, summary });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});