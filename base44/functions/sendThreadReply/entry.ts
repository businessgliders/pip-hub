import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendThreadReply — sends an outbound Gmail reply for a Thread, records an
 * EmailMessage, and bumps the thread's last_activity_at.
 *
 * Payload: { thread_id, body_html }
 */
function buildMime({ to, from, subject, bodyHtml, inReplyTo }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
  ];
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }
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

    const subject = `Re: ${thread.subject || 'Your inquiry'}`;
    const mime = buildMime({
      to: thread.contact_email,
      from: user.email,
      subject,
      bodyHtml: body_html,
    });

    const sendBody = { raw: base64url(mime) };
    if (thread.gmail_thread_id) sendBody.threadId = thread.gmail_thread_id;

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(sendBody),
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: 'Gmail send failed', details: text }, { status: 502 });
    }
    const sent = await res.json();
    const nowIso = new Date().toISOString();

    await db.EmailMessage.create({
      ticket_id: thread_id,
      gmail_thread_id: sent.threadId || thread.gmail_thread_id || '',
      gmail_message_id: sent.id || '',
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

    await db.Thread.update(thread_id, {
      last_activity_at: nowIso,
      gmail_thread_id: sent.threadId || thread.gmail_thread_id || '',
      snippet: body_html.replace(/<[^>]+>/g, '').slice(0, 140),
    });

    return Response.json({ success: true, message_id: sent.id, thread_id: sent.threadId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});