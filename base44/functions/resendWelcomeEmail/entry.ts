import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * resendWelcomeEmail — re-sends the per-inbox "welcome" auto-reply template to
 * the contact of a given Thread, threaded into the existing Gmail conversation,
 * and logs it as an is_welcome EmailMessage.
 *
 * Payload: { thread_id }
 */
const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

const FROM_BY_SOURCE = {
  support: { name: 'Support @ Pilates in Pink ™', email: 'support@pilatesinpinkstudio.com', tag: 'Ticket' },
  events: { name: 'Events @ Pilates in Pink ™', email: 'events@pilatesinpinkstudio.com', tag: 'Request' },
  influencer: { name: 'Influencer @ Pilates in Pink ™', email: 'influencer@pilatesinpinkstudio.com', tag: 'Application' },
};

function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(p|div|br|h[1-6]|li)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str || '');
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/(.{1,76})/g, '$1\r\n').trim();
}

function encodeHeader(str) {
  const s = str || '';
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;
}

function base64url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Fill {{placeholder}} tokens from the thread + form_data.
function applyVars(str, vars) {
  return String(str || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : ''));
}

function buildMime({ to, from, subject, htmlBody, textBody, inReplyTo, references }) {
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
  ];
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);
  lines.push('');
  lines.push(`--${altBoundary}`);
  lines.push('Content-Type: text/plain; charset=UTF-8');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(utf8ToBase64(textBody));
  lines.push(`--${altBoundary}`);
  lines.push('Content-Type: text/html; charset=UTF-8');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(utf8ToBase64(htmlBody));
  lines.push(`--${altBoundary}--`);
  return lines.join('\r\n');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isStaff = user && (user.role === 'admin' || String(user.email || '').toLowerCase().endsWith(`@${STAFF_DOMAIN}`));
    if (!isStaff) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { thread_id } = await req.json();
    if (!thread_id) {
      return Response.json({ error: 'Missing thread_id' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const thread = await db.Thread.get(thread_id);
    if (!thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }
    if (!thread.contact_email) {
      return Response.json({ error: 'Thread has no contact email' }, { status: 400 });
    }

    // Find the active welcome template for this inbox.
    const templates = await db.EmailTemplate.filter(
      { source_app: thread.source_app, template_kind: 'welcome' }, '-updated_date', 5
    );
    const template = templates.find((t) => t.is_active) || templates[0];
    if (!template) {
      return Response.json({ error: 'No welcome template configured for this inbox' }, { status: 404 });
    }

    const fd = thread.form_data || {};
    const fullName = thread.contact_name || fd.name || '';
    const firstName = fullName.split(/\s+/)[0] || fullName;
    const tagWord = (FROM_BY_SOURCE[thread.source_app] || {}).tag || 'Ticket';
    const ticketId = thread.ticket_number ? `#${thread.ticket_number}` : '';
    const vars = {
      client_name: fullName,
      client_first_name: firstName,
      ticket_id: ticketId,
      content_style: fd.content_style || '',
    };

    const subject = applyVars(template.subject, vars).replace(/\s+/g, ' ').trim();
    const html = applyVars(template.body_html || template.body || '', vars);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Thread the resend into the existing Gmail conversation if we have one.
    const priorMsgs = await db.EmailMessage.filter({ ticket_id: thread_id }, '-sent_at', 1);
    const lastRfcId = priorMsgs[0]?.rfc_message_id || thread.gmail_root_message_id || '';
    const rootId = thread.gmail_root_message_id || lastRfcId || '';
    const references = [rootId, lastRfcId].filter((v, i, a) => v && a.indexOf(v) === i).join(' ');

    const sender = FROM_BY_SOURCE[thread.source_app] || { name: user.full_name || user.email, email: user.email };
    const fromHeader = `${encodeHeader(sender.name)} <${sender.email}>`;

    const mime = buildMime({
      to: thread.contact_email,
      from: fromHeader,
      subject,
      htmlBody: html,
      textBody: stripHtml(html),
      inReplyTo: lastRfcId,
      references,
    });

    const sendBody = { raw: base64url(mime) };
    if (thread.gmail_thread_id) sendBody.threadId = thread.gmail_thread_id;

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(sendBody),
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: 'Gmail send failed', details: text }, { status: 502 });
    }
    const sent = await res.json();
    const nowIso = new Date().toISOString();

    let rfcMessageId = '';
    try {
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${sent.id}?format=metadata&metadataHeaders=Message-ID`,
        { headers: authHeader }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const h = (meta.payload?.headers || []).find((x) => x.name.toLowerCase() === 'message-id');
        rfcMessageId = h?.value || '';
      }
    } catch (_) { /* non-fatal */ }

    await db.EmailMessage.create({
      ticket_id: thread_id,
      gmail_thread_id: sent.threadId || thread.gmail_thread_id || '',
      gmail_message_id: sent.id || '',
      rfc_message_id: rfcMessageId,
      in_reply_to: lastRfcId,
      references,
      direction: 'outbound',
      from_email: sender.email,
      from_name: sender.name,
      to_email: thread.contact_email,
      subject,
      body_html: html,
      snippet: stripHtml(html).slice(0, 200),
      is_welcome: true,
      sent_by: user.email,
      sent_at: nowIso,
      send_status: 'sent',
    });

    const threadUpdate = {
      last_activity_at: nowIso,
      gmail_thread_id: sent.threadId || thread.gmail_thread_id || '',
    };
    if (!thread.gmail_root_message_id && rfcMessageId) {
      threadUpdate.gmail_root_message_id = rfcMessageId;
    }
    await db.Thread.update(thread_id, threadUpdate);

    return Response.json({ success: true, message_id: sent.id, subject, to: thread.contact_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});