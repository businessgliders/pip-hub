import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendAssignmentEmail — notifies a staff member (via Gmail) that a Thread has
 * been assigned/escalated to them, and creates an in-app Notification.
 *
 * Payload: { thread_id, assigned_to }
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
function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const isStaff = user && (user.role === 'admin' || String(user.email || '').toLowerCase().endsWith(`@${STAFF_DOMAIN}`));
    if (!isStaff) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { thread_id, assigned_to } = await req.json();
    if (!thread_id || !assigned_to) {
      return Response.json({ error: 'thread_id and assigned_to required' }, { status: 400 });
    }

    const db = base44.asServiceRole.entities;
    const thread = await db.Thread.get(thread_id);
    if (!thread) return Response.json({ error: 'Thread not found' }, { status: 404 });

    const ticketTag = thread.ticket_number ? `#${thread.ticket_number} ` : '';
    const subject = `Assigned to you: ${ticketTag}${thread.subject || 'Inquiry'}`;
    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;color:#1f2937;line-height:1.6">
        <h2 style="margin:0 0 8px">A conversation was escalated to you</h2>
        <p>${escapeHtml(user.full_name || user.email)} assigned the following conversation to you:</p>
        <table style="margin:12px 0;border-collapse:collapse">
          <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Ticket</td><td><strong>${ticketTag || '—'}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Subject</td><td>${escapeHtml(thread.subject || '—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Contact</td><td>${escapeHtml(thread.contact_name || thread.contact_email || '—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Inbox</td><td>${escapeHtml(thread.source_app || '—')}</td></tr>
        </table>
        ${thread.snippet ? `<p style="color:#374151">"${escapeHtml(thread.snippet)}"</p>` : ''}
        <p>Open the PiP Inbox to respond.</p>
      </div>`.trim();

    // Send via Gmail so it reaches any address (not just registered users).
    let emailSent = false;
    let emailError = '';
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      const mime = [
        `From: ${encodeHeader('Pilates in Pink ™')} <support@${STAFF_DOMAIN}>`,
        `To: ${assigned_to}`,
        `Subject: ${encodeHeader(subject)}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        html,
      ].join('\r\n');
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: base64url(mime) }),
      });
      emailSent = res.ok;
      if (!res.ok) emailError = (await res.text()).slice(0, 300);
    } catch (e) {
      emailError = e.message;
    }

    // In-app notification
    await db.Notification.create({
      recipient_email: assigned_to,
      type: 'assignment',
      title: `Assigned: ${ticketTag}${thread.subject || 'Inquiry'}`,
      body: `${user.full_name || user.email} escalated this to you.`,
      thread_id,
      source_app: thread.source_app,
      is_read: false,
    });

    return Response.json({ success: true, email_sent: emailSent, email_error: emailError });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});