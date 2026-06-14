import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendThreadReply — sends an outbound Gmail reply for a Thread, records an
 * EmailMessage, and bumps the thread's last_activity_at.
 *
 * Payload: { thread_id, body_html }
 */
function buildMime({ to, from, subject, bodyHtml, inReplyTo, references }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
  ];
  if (inReplyTo) headers.push(`In-Reply-To: ${inReplyTo}`);
  if (references) headers.push(`References: ${references}`);
  return headers.join('\r\n') + '\r\n\r\n' + bodyHtml;
}

function base64url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { thread_id, body_html } = await req.json();
    if (!thread_id || !body_html) {
      return Response.json({ error: 'Missing thread_id or body_html' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const thread = await db.Thread.get(thread_id);
    if (!thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Build threaded subject: include [Ticket #N] so replies thread reliably even
    // across Gmail thread splits. Keep "Re:" prefix on existing conversations.
    const ticketTag = thread.ticket_number ? `[Ticket #${thread.ticket_number}] ` : '';
    const baseSubject = thread.subject || 'Your inquiry';
    const hasReplies = !!thread.gmail_thread_id;
    const subject = `${hasReplies ? 'Re: ' : ''}${ticketTag}${baseSubject}`.replace(/\s+/g, ' ').trim();

    // RFC threading: find the most recent message in this thread to chain off,
    // and use the thread's root Message-ID for the References header.
    const priorMsgs = await db.EmailMessage.filter({ ticket_id: thread_id }, '-sent_at', 1);
    const lastRfcId = priorMsgs[0]?.rfc_message_id || thread.gmail_root_message_id || '';
    const rootId = thread.gmail_root_message_id || lastRfcId || '';
    const references = [rootId, lastRfcId].filter((v, i, a) => v && a.indexOf(v) === i).join(' ');

    const mime = buildMime({
      to: thread.contact_email,
      from: user.email,
      subject,
      bodyHtml: body_html,
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

    // Fetch the sent message's RFC Message-ID header so future replies can chain off it.
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
      from_email: user.email,
      from_name: user.full_name || user.email,
      to_email: thread.contact_email,
      subject,
      body_html,
      sent_by: user.email,
      sent_at: nowIso,
      send_status: 'sent',
    });

    // If the thread had no root Message-ID yet, this becomes the root.
    const threadUpdate = {
      last_activity_at: nowIso,
      gmail_thread_id: sent.threadId || thread.gmail_thread_id || '',
      snippet: body_html.replace(/<[^>]+>/g, '').slice(0, 140),
    };
    if (!thread.gmail_root_message_id && rfcMessageId) {
      threadUpdate.gmail_root_message_id = rfcMessageId;
    }
    await db.Thread.update(thread_id, threadUpdate);

    return Response.json({ success: true, message_id: sent.id, rfc_message_id: rfcMessageId, thread_id: sent.threadId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});