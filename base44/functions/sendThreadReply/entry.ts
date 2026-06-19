import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendThreadReply — sends an outbound Gmail reply for a Thread, records an
 * EmailMessage, and bumps the thread's last_activity_at.
 *
 * Payload: { thread_id, body_html, attachments?: [{ url, filename, contentType, size }] }
 */
const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

// Per-inbox shared From address. NOTE: each address must be configured as a
// verified "send-as" alias on the connected Gmail account, otherwise Gmail
// rewrites the From to the authenticated mailbox.
// From Name matches what the spoke apps (pip-support, pip-events, pip-partner)
// actually send — all three use "Pilates in Pink ™".
const FROM_BY_SOURCE = {
  support: { name: 'Support @ Pilates in Pink ™', email: 'support@pilatesinpinkstudio.com', tag: 'Ticket' },
  events: { name: 'Events @ Pilates in Pink ™', email: 'events@pilatesinpinkstudio.com', tag: 'Request' },
  influencer: { name: 'Influencer @ Pilates in Pink ™', email: 'influencer@pilatesinpinkstudio.com', tag: 'Application' },
};

// Build the default signature for the logged-in staff member.
// info@ uses "Front Desk" as the first name; everyone else uses their first name.
function firstNameForUser(user) {
  const email = String(user?.email || '').toLowerCase();
  if (email === 'info@pilatesinpinkstudio.com') return 'Front Desk';
  const full = String(user?.full_name || '').trim();
  if (full) return full.split(/\s+/)[0];
  return String(user?.email || '').split('@')[0] || '';
}

function signatureHtml(user) {
  const name = firstNameForUser(user);
  return `<div><br></div><div>Best,</div><div>${name}</div><div>Pilates in Pink™</div>`;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(p|div|br|h[1-6]|li)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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

function chunkBase64(b64, size = 76) {
  return b64.replace(new RegExp(`(.{1,${size}})`, 'g'), '$1\r\n').trim();
}

// RFC 2047 encode a header value when it contains non-ASCII chars (e.g. em dash, emoji).
function encodeHeader(str) {
  const s = str || '';
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;
}

function base64url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function fetchAttachmentBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch attachment: ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  return { base64: btoa(bin), contentType };
}

function buildMime({ to, from, subject, htmlBody, textBody, inReplyTo, references, attachments = [] }) {
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const mixedBoundary = `mix_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const hasAttachments = attachments && attachments.length > 0;

  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
  ];
  if (hasAttachments) {
    lines.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
  } else {
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
  }
  if (inReplyTo) lines.push(`In-Reply-To: ${inReplyTo}`);
  if (references) lines.push(`References: ${references}`);
  lines.push('');

  if (hasAttachments) {
    lines.push(`--${mixedBoundary}`);
    lines.push(`Content-Type: multipart/alternative; boundary="${altBoundary}"`);
    lines.push('');
  }

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

  if (hasAttachments) {
    for (const att of attachments) {
      lines.push(`--${mixedBoundary}`);
      lines.push(`Content-Type: ${att.contentType}; name="${att.filename}"`);
      lines.push('Content-Transfer-Encoding: base64');
      lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
      lines.push('');
      lines.push(chunkBase64(att.base64));
    }
    lines.push(`--${mixedBoundary}--`);
  }

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

    const { thread_id, body_html, attachments: attachmentInputs, is_template } = await req.json();
    if (!thread_id || !body_html) {
      return Response.json({ error: 'Missing thread_id or body_html' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const thread = await db.Thread.get(thread_id);
    if (!thread) {
      return Response.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Fetch + base64-encode attachments server-side
    const mimeAttachments = [];
    const attachmentMeta = [];
    if (Array.isArray(attachmentInputs)) {
      for (const att of attachmentInputs) {
        if (!att?.url || !att?.filename) continue;
        const { base64, contentType } = await fetchAttachmentBase64(att.url);
        const resolvedType = att.contentType || contentType;
        mimeAttachments.push({ filename: att.filename, contentType: resolvedType, base64 });
        attachmentMeta.push({ filename: att.filename, url: att.url, content_type: resolvedType, size: att.size || null });
      }
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Keep the EXACT subject of the original thread for every reply — no "Re:"
    // prefix and no re-adding the ticket tag. Gmail threads by both subject and
    // References/threadId, so reusing the original subject (already carrying the
    // [Ticket #N] tag from the welcome email) guarantees the reply lands in the
    // same conversation on both our side and the submitter's side. We derive the
    // canonical subject from the first stored message when available, falling
    // back to the thread subject + ticket tag.
    const firstMsg = (await db.EmailMessage.filter({ ticket_id: thread_id }, 'sent_at', 1))[0];
    const tagWord = (FROM_BY_SOURCE[thread.source_app] || {}).tag || 'Ticket';
    const ticketTag = thread.ticket_number ? `[${tagWord} #${thread.ticket_number}] ` : '';
    const baseSubject = thread.subject || 'Your inquiry';
    const subject = (firstMsg?.subject || `${ticketTag}${baseSubject}`)
      .replace(/^\s*(re|fwd?)\s*:\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    const priorMsgs = await db.EmailMessage.filter({ ticket_id: thread_id }, '-sent_at', 1);
    const lastRfcId = priorMsgs[0]?.rfc_message_id || thread.gmail_root_message_id || '';
    const rootId = thread.gmail_root_message_id || lastRfcId || '';
    const references = [rootId, lastRfcId].filter((v, i, a) => v && a.indexOf(v) === i).join(' ');

    const sender = FROM_BY_SOURCE[thread.source_app] || { name: user.full_name || user.email, email: user.email };
    const fromHeader = `${encodeHeader(sender.name)} <${sender.email}>`;

    // Auto-append the logged-in user's signature to every outbound reply.
    const finalHtml = `${body_html}${signatureHtml(user)}`;

    const mime = buildMime({
      to: thread.contact_email,
      from: fromHeader,
      subject,
      htmlBody: finalHtml,
      textBody: stripHtml(finalHtml),
      inReplyTo: lastRfcId,
      references,
      attachments: mimeAttachments,
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
      body_html: finalHtml,
      attachments: attachmentMeta,
      is_template: !!is_template,
      sent_by: user.email,
      sent_at: nowIso,
      send_status: 'sent',
    });

    const threadUpdate = {
      last_activity_at: nowIso,
      gmail_thread_id: sent.threadId || thread.gmail_thread_id || '',
      snippet: stripHtml(body_html).slice(0, 140),
      // Any reply sent through this function is a manual (non-auto-reply) outbound reply.
      has_outbound_reply: true,
    };
    if (!thread.gmail_root_message_id && rfcMessageId) {
      threadUpdate.gmail_root_message_id = rfcMessageId;
    }

    // Influencer: auto-advance New -> Progress on the first manual outbound reply.
    // The status-change reason is a 1-line AI summary of this reply.
    if (thread.source_app === 'influencer' && thread.status === 'open') {
      let summary = stripHtml(body_html).replace(/\s+/g, ' ').trim().slice(0, 140);
      try {
        const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Summarize this outbound reply to an influencer applicant in ONE short sentence (max 15 words), describing what the staff member said/did:\n\n${stripHtml(body_html)}`,
        });
        if (typeof ai === 'string' && ai.trim()) summary = ai.trim();
      } catch (_) { /* fall back to truncated body */ }

      threadUpdate.status = 'influencer_progress';
      threadUpdate.status_history = [
        ...(thread.status_history || []),
        { status: 'influencer_progress', changed_by: user.email, name: user.full_name || user.email, note: summary, timestamp: nowIso },
      ];
    }

    await db.Thread.update(thread_id, threadUpdate);

    return Response.json({ success: true, message_id: sent.id, rfc_message_id: rfcMessageId, thread_id: sent.threadId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});