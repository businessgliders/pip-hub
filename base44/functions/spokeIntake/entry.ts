import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Per-inbox From alias + subject threading tag (mirrors sendThreadReply).
const FROM_BY_SOURCE = {
  support: { name: 'Pilates in Pink ™', email: 'support@pilatesinpinkstudio.com', tag: 'Ticket' },
  events: { name: 'Pilates in Pink ™', email: 'events@pilatesinpinkstudio.com', tag: 'Request' },
  influencer: { name: 'Pilates in Pink ™', email: 'partner@pilatesinpinkstudio.com', tag: 'Request' },
};

function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(p|div|br|h[1-6]|li)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fillTemplate(str, vars) {
  return (str || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : ''));
}

function encodeHeader(str) {
  const s = str || '';
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;
}

function base64url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Base64-encode a UTF-8 string for safe email transport. Quoted-printable can
// corrupt multi-byte UTF-8 (emoji, ™, em dashes) when soft line breaks land
// mid-sequence — base64 avoids this entirely.
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str || '');
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/(.{1,76})/g, '$1\r\n').trim();
}

function buildMime({ to, from, subject, htmlBody, textBody }) {
  const b = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return [
    `From: ${from}`, `To: ${to}`, `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0', `Content-Type: multipart/alternative; boundary="${b}"`, '',
    `--${b}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
    utf8ToBase64(textBody),
    `--${b}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '',
    utf8ToBase64(htmlBody),
    `--${b}--`,
  ].join('\r\n');
}

/**
 * Sends the auto-acknowledgement (welcome) email to the submitter using the
 * active welcome EmailTemplate for this source, and records it as the first
 * (is_welcome) EmailMessage on the thread. Non-blocking / best-effort.
 */
async function sendAcknowledgement(base44, db, thread) {
  const cfg = FROM_BY_SOURCE[thread.source_app];
  if (!cfg) return;

  const templates = await db.EmailTemplate.filter({
    source_app: thread.source_app, template_kind: 'welcome', is_active: true,
  }, '-created_date', 1);
  const tpl = templates[0];
  if (!tpl || (!tpl.body_html && !tpl.body)) return; // no template -> skip silently

  const firstName = (thread.contact_name || '').split(' ')[0] || thread.contact_name || '';
  const vars = {
    client_name: thread.contact_name || thread.contact_email,
    client_first_name: firstName,
    client_email: thread.contact_email,
    ticket_id: thread.ticket_number ? `#${thread.ticket_number}` : '',
    ...(thread.form_data || {}),
  };

  const bodyHtml = fillTemplate(tpl.body_html || tpl.body, vars);
  const baseSubject = fillTemplate(tpl.subject || thread.subject || 'Your inquiry', vars);
  // Only prepend the threading tag if the template subject doesn't already carry one
  // (e.g. "[Ticket #1234] ..." or "[Request #12] ..."), to avoid a doubled tag.
  const alreadyTagged = /\[(?:Ticket|Request|Application)\s*#?\d+\]/i.test(baseSubject);
  const tag = (!alreadyTagged && thread.ticket_number) ? `[${cfg.tag} #${thread.ticket_number}] ` : '';
  const subject = `${tag}${baseSubject}`.replace(/\s+/g, ' ').trim();
  const fromHeader = `${encodeHeader(cfg.name)} <${cfg.email}>`;

  const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
  const mime = buildMime({
    to: thread.contact_email, from: fromHeader, subject,
    htmlBody: bodyHtml, textBody: stripHtml(bodyHtml),
  });

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: base64url(mime) }),
  });
  if (!res.ok) return;
  const sent = await res.json();
  const nowIso = new Date().toISOString();

  let rfcMessageId = '';
  try {
    const metaRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${sent.id}?format=metadata&metadataHeaders=Message-ID`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const meta = await metaRes.json();
      const h = (meta.payload?.headers || []).find((x) => x.name.toLowerCase() === 'message-id');
      rfcMessageId = h?.value || '';
    }
  } catch (_) { /* non-fatal */ }

  await db.EmailMessage.create({
    ticket_id: thread.id,
    gmail_thread_id: sent.threadId || '',
    gmail_message_id: sent.id || '',
    rfc_message_id: rfcMessageId,
    direction: 'outbound',
    from_email: cfg.email,
    from_name: cfg.name,
    to_email: thread.contact_email,
    subject,
    body_html: bodyHtml,
    snippet: stripHtml(bodyHtml).slice(0, 200),
    sent_by: 'system',
    sent_at: nowIso,
    is_welcome: true,
    send_status: 'sent',
  });

  await db.Thread.update(thread.id, {
    gmail_thread_id: sent.threadId || '',
    ...(rfcMessageId ? { gmail_root_message_id: rfcMessageId } : {}),
  });
}

/**
 * spokeIntake — server-to-server webhook called by the public spoke apps
 * (pip-support / pip-events / pip-partner) on every new form submission.
 *
 * Auth: Authorization: Bearer <SPOKE_INTAKE_SECRET>
 * Body: { source_app: "support"|"events"|"partner", name, email, phone, subject, ...anyOtherFields }
 *
 * Behavior:
 *  1. Upsert a Contact by email.
 *  2. Duplicate guard: ignore if a thread with same email + same spoke exists within 5 min.
 *  3. Create a Thread linked to the contact, storing all raw fields in form_data.
 */
Deno.serve(async (req) => {
  // Handles spoke form submissions; assigns per-inbox ticket numbers.
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const secret = Deno.env.get('SPOKE_INTAKE_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    const provided = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!secret || provided !== secret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { source_app, name, email, phone, subject, ...rest } = body;

    if (!source_app || !['support', 'events', 'influencer'].includes(source_app)) {
      return Response.json({ error: 'Invalid or missing source_app' }, { status: 400 });
    }
    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const now = new Date();
    const nowIso = now.toISOString();
    const normalizedEmail = String(email).trim().toLowerCase();

    // 1. Upsert Contact by email
    const existingContacts = await db.Contact.filter({ email: normalizedEmail });
    let contact;
    if (existingContacts.length > 0) {
      contact = existingContacts[0];
      await db.Contact.update(contact.id, {
        name: name || contact.name,
        phone: phone || contact.phone,
        last_activity_at: nowIso,
      });
    } else {
      contact = await db.Contact.create({
        name: name || normalizedEmail,
        email: normalizedEmail,
        phone: phone || '',
        labels: [],
        last_activity_at: nowIso,
      });
    }

    // 2. Duplicate guard — same email + spoke within last 5 minutes
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const recent = await db.Thread.filter({
      contact_email: normalizedEmail,
      source_app: source_app,
    }, '-created_date', 5);
    const dupe = recent.find((t) => (t.created_date || '') >= fiveMinAgo);
    if (dupe) {
      return Response.json({ thread_id: dupe.id, contact_id: contact.id, duplicate: true });
    }

    // 3. Assign a per-inbox sequential ticket number (SUP/EVT/INF + N).
    // Numbering starts at 1001 per source. We read the latest thread for this
    // source that has a ticket_number and increment it.
    const lastNumbered = await db.Thread.filter(
      { source_app: source_app },
      '-ticket_number',
      1
    );
    const lastNum = lastNumbered.find((t) => typeof t.ticket_number === 'number');
    const nextTicketNumber = lastNum ? lastNum.ticket_number + 1 : 1001;

    // 4. Create Thread
    const snippet = (rest.message || rest.notes || subject || '')
      .toString()
      .slice(0, 140);

    // Each inbox uses its own "open" starting stage: Events uses the EventLead
    // pipeline ("New"); support/influencer use the generic "open".
    const initialStatus = source_app === 'events' ? 'New' : 'open';

    const thread = await db.Thread.create({
      contact_id: contact.id,
      contact_email: normalizedEmail,
      contact_name: name || normalizedEmail,
      source_app,
      subject: subject || `New ${source_app} submission`,
      snippet,
      ticket_number: nextTicketNumber,
      status: initialStatus,
      form_data: { name, email: normalizedEmail, phone, subject, ...rest },
      last_activity_at: nowIso,
      is_read: false,
      status_history: [{ status: initialStatus, changed_by: 'system', timestamp: nowIso }],
    });

    // 5. Send the auto-acknowledgement email to the submitter (best-effort —
    // never fail the intake if the email send hiccups).
    let acknowledgement_sent = false;
    try {
      await sendAcknowledgement(base44, db, thread);
      acknowledgement_sent = true;
    } catch (_) { /* non-fatal: thread is already created */ }

    return Response.json({ thread_id: thread.id, contact_id: contact.id, acknowledgement_sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});