import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
// @ts-ignore
import nodemailer from 'npm:nodemailer@6.9.14';

const encodeRFC2047 = (text) => {
  const buf = new TextEncoder().encode(text);
  const b64 = btoa(String.fromCharCode(...buf));
  return `=?UTF-8?B?${b64}?=`;
};

const buildMime = async ({ from, to, subject, html, inReplyTo, references, threadHeaders }) => {
  const transport = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
  const fromEncoded = from.includes('<')
    ? from.replace(/^([^<]+)/, (name) => encodeRFC2047(name.trim()))
    : from;
  const headers = {};
  if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
  if (references) headers['References'] = references;
  const info = await transport.sendMail({
    from: fromEncoded,
    to,
    subject,
    html,
    headers,
  });
  return info.message.toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { emailId, replyHtml, fromAlias = 'support@pilatesinpinkstudio.com', fromName = 'Pilates in Pink Support' } = await req.json();
    if (!emailId || !replyHtml) {
      return Response.json({ error: 'Missing emailId or replyHtml' }, { status: 400 });
    }

    const email = await base44.asServiceRole.entities.IncomingEmail.get(emailId);
    if (!email) return Response.json({ error: 'Email not found' }, { status: 404 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Fetch original Message-ID header for threading
    let originalMessageIdHeader = '';
    let originalReferences = '';
    try {
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.gmail_message_id}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const headers = meta.payload?.headers || [];
        originalMessageIdHeader = headers.find(h => h.name?.toLowerCase() === 'message-id')?.value || '';
        originalReferences = headers.find(h => h.name?.toLowerCase() === 'references')?.value || '';
      }
    } catch (e) {
      console.warn('Could not fetch original headers for threading', e);
    }

    const replySubject = email.subject?.toLowerCase().startsWith('re:')
      ? email.subject
      : `Re: ${email.subject || ''}`;

    const references = [originalReferences, originalMessageIdHeader].filter(Boolean).join(' ');

    const raw = await buildMime({
      from: `${fromName} <${fromAlias}>`,
      to: email.from_email,
      subject: replySubject,
      html: replyHtml,
      inReplyTo: originalMessageIdHeader,
      references,
    });

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw, threadId: email.gmail_thread_id || undefined }),
    });

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      console.error('Gmail send failed', sendRes.status, errText);
      return Response.json({ error: 'Gmail send failed', details: errText }, { status: 500 });
    }

    // Mark the email as processed
    await base44.asServiceRole.entities.IncomingEmail.update(emailId, {
      status: 'processed',
      processing_notes: `Replied by ${user.email} at ${new Date().toISOString()}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendSupportReply error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});