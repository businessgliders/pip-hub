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

    const { bug_report_id, body_html } = await req.json();
    if (!bug_report_id || !body_html || !String(body_html).trim()) {
      return Response.json({ error: 'bug_report_id and body_html required' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const report = await db.BugReport.get(bug_report_id);
    if (!report) return Response.json({ error: 'Bug report not found' }, { status: 404 });

    const escalationTo = report.escalated_to || Deno.env.get('BUG_REPORT_ESCALATION_TO') || '';
    if (!escalationTo) return Response.json({ error: 'No escalation recipient on this report' }, { status: 400 });

    const fromEmail = Deno.env.get('BUG_REPORT_FROM_EMAIL') || `support@${STAFF_DOMAIN}`;
    const domain = fromEmail.split('@')[1] || STAFF_DOMAIN;
    const subject = `Re: [Bug #${report.bug_number}] ${report.title || 'Issue reported'}`;
    const newMsgId = `<bug-${report.bug_number}-${Date.now()}@${domain}>`;
    const root = report.rfc_message_id || '';

    const headers = [
      `From: ${encodeHeader('Pilates in Pink ™')} <${fromEmail}>`,
      `To: ${escalationTo}`,
      `Subject: ${encodeHeader(subject)}`,
      `Message-ID: ${newMsgId}`,
    ];
    if (root) {
      headers.push(`In-Reply-To: ${root}`);
      headers.push(`References: ${root}`);
    }
    headers.push('MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8', '', body_html);
    const mime = headers.join('\r\n');

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
      direction: 'outbound',
      from_email: fromEmail,
      from_name: user.full_name || 'Staff',
      to_email: escalationTo,
      subject,
      body_html,
      rfc_message_id: newMsgId,
      gmail_message_id: sent.id || '',
      sent_at: nowIso,
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