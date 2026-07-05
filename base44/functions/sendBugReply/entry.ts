import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendBugReply — sends a staff reply into an existing bug escalation Gmail
 * thread (to the escalation recipient) and appends the message to the
 * BugReport.replies array so it renders as an outbound bubble in the inbox.
 *
 * Payload: { bug_report_id, body_html }
 */
const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

function encodeHeader(str) {
  const s = str || '';
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;
}
function base64url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isStaff = user && (user.role === 'admin' || String(user.email || '').toLowerCase().endsWith(`@${STAFF_DOMAIN}`));
    if (!isStaff) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { bug_report_id, body_html, attachments, sender_name } = await req.json();
    if (!bug_report_id || !body_html || !String(body_html).trim()) {
      return Response.json({ error: 'bug_report_id and body_html required' }, { status: 400 });
    }
    const senderName = (sender_name && String(sender_name).trim()) || user.full_name || 'Staff';
    const files = Array.isArray(attachments) ? attachments.filter((a) => a && a.url) : [];

    const db = base44.asServiceRole.entities;
    const report = await db.BugReport.get(bug_report_id);
    if (!report) return Response.json({ error: 'Bug report not found' }, { status: 404 });

    const escalationTo = report.escalated_to || Deno.env.get('BUG_REPORT_ESCALATION_TO') || '';
    if (!escalationTo) return Response.json({ error: 'No escalation recipient on this report' }, { status: 400 });

    // When Gurpreen (the escalation recipient) is the one replying, reverse the
    // direction: she sends FROM gurpreen@ TO the report-bug inbox.
    const reportBugEmail = Deno.env.get('BUG_REPORT_FROM_EMAIL') || `reportbug@${STAFF_DOMAIN}`;
    const isGurpreen = String(user.email || '').toLowerCase() === escalationTo.toLowerCase();
    const fromEmail = isGurpreen ? escalationTo : reportBugEmail;
    // Front-desk (info@) / non-Gurpreen replies mirror the original bug report's
    // recipients so the escalation loop is preserved: escalation recipient + gokenko.
    const toEmail = isGurpreen ? reportBugEmail : `${escalationTo}, support@gokenko.com`;
    const domain = fromEmail.split('@')[1] || STAFF_DOMAIN;
    // Reuse the same subject line as the original escalation (with the AI summary,
    // no "Re:" prefix) so every message stays in one unified Gmail thread/subject.
    const subjectText = report.subject_summary || report.title || 'Issue reported';
    const subject = `[Bug #${report.bug_number}] ${subjectText}${report.client_name ? ` - ${report.client_name}` : ''}`;
    const newMsgId = `<bug-${report.bug_number}-${Date.now()}@${domain}>`;
    const root = report.rfc_message_id || '';

    const headers = [
      `From: ${encodeHeader(isGurpreen ? senderName : 'Pilates in Pink ™')} <${fromEmail}>`,
      `To: ${toEmail}`,
      `Subject: ${encodeHeader(subject)}`,
      `Message-ID: ${newMsgId}`,
    ];
    if (root) {
      headers.push(`In-Reply-To: ${root}`);
      headers.push(`References: ${root}`);
    }
    headers.push('MIME-Version: 1.0');

    let mime;
    if (files.length > 0) {
      // Fetch each attachment and base64-encode it into a multipart/mixed body.
      const boundary = `b44_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const parts = [];
      parts.push(`--${boundary}`);
      parts.push('Content-Type: text/html; charset=UTF-8', '', body_html, '');

      for (const f of files) {
        try {
          const resp = await fetch(f.url);
          if (!resp.ok) continue;
          const buf = new Uint8Array(await resp.arrayBuffer());
          let binary = '';
          for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
          const b64 = btoa(binary).replace(/(.{76})/g, '$1\r\n');
          const ctype = f.type || resp.headers.get('content-type') || 'application/octet-stream';
          const fname = f.name || (f.url.split('/').pop() || 'attachment');
          parts.push(`--${boundary}`);
          parts.push(`Content-Type: ${ctype}; name="${fname}"`);
          parts.push('Content-Transfer-Encoding: base64');
          parts.push(`Content-Disposition: attachment; filename="${fname}"`, '', b64, '');
        } catch (_) { /* skip unreachable attachment */ }
      }
      parts.push(`--${boundary}--`);
      headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`, '');
      mime = headers.join('\r\n') + '\r\n' + parts.join('\r\n');
    } else {
      headers.push('Content-Type: text/html; charset=UTF-8', '', body_html);
      mime = headers.join('\r\n');
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const sendBody = { raw: base64url(mime) };
    if (report.gmail_thread_id) sendBody.threadId = report.gmail_thread_id;

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(sendBody),
    });
    if (!res.ok) {
      const err = (await res.text()).slice(0, 300);
      return Response.json({ error: `Gmail send failed: ${err}` }, { status: 502 });
    }
    const sent = await res.json().catch(() => ({}));

    const nowIso = new Date().toISOString();
    const reply = {
      // Gurpreen's replies are inbound relative to the report-bug inbox (so the
      // panel reverses for her); everyone else's are outbound.
      direction: isGurpreen ? 'inbound' : 'outbound',
      from_email: fromEmail,
      from_name: senderName,
      to_email: toEmail,
      subject,
      body_html,
      rfc_message_id: newMsgId,
      gmail_message_id: sent.id || '',
      sent_at: nowIso,
      attachments: files.map((f) => ({ filename: f.name || '', url: f.url, content_type: f.type || '' })),
    };

    await db.BugReport.update(bug_report_id, {
      replies: [...(report.replies || []), reply],
      gmail_thread_id: report.gmail_thread_id || sent.threadId || '',
    });

    return Response.json({ success: true, reply });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});