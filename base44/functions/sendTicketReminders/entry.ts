import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendTicketReminders — for every open/in-progress Support thread that is
 * assigned to someone and hasn't been reminded in the last 24h, emails the
 * assignee and creates an in-app Notification. Intended to run on a schedule.
 *
 * Admin-only (scheduled automations run as the app, but guard direct calls).
 */
const STAFF_DOMAIN = 'pilatesinpinkstudio.com';
const OPEN_STATUSES = ['open', 'in_progress', 'waiting'];

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
    // Allow admins to trigger manually; scheduled runs have no user but a valid app token.
    if (user && user.role !== 'admin' && !String(user.email || '').toLowerCase().endsWith(`@${STAFF_DOMAIN}`)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = base44.asServiceRole.entities;
    const threads = await db.Thread.filter({ source_app: 'support', archived: false }, '-last_activity_at', 500);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    let remindersSent = 0;

    let accessToken = null;
    try {
      ({ accessToken } = await base44.asServiceRole.connectors.getConnection('gmail'));
    } catch (_) { /* gmail unavailable; notifications still created */ }

    for (const t of threads) {
      if (!OPEN_STATUSES.includes(t.status)) continue;
      if (!t.assignee_email) continue;
      const last = t.last_reminder_sent ? new Date(t.last_reminder_sent).getTime() : 0;
      if (now - last < dayMs) continue;

      const ticketTag = t.ticket_number ? `#${t.ticket_number} ` : '';
      const subject = `Reminder: pending ticket ${ticketTag}${t.contact_name || ''}`.trim();

      if (accessToken) {
        try {
          const html = `
            <div style="font-family:system-ui,Arial,sans-serif;color:#1f2937;line-height:1.6">
              <h2 style="margin:0 0 8px">Ticket reminder</h2>
              <p>You have a pending support ticket that needs attention:</p>
              <p><strong>Ticket:</strong> ${ticketTag || '—'}<br/>
              <strong>Contact:</strong> ${escapeHtml(t.contact_name || t.contact_email || '—')}<br/>
              <strong>Subject:</strong> ${escapeHtml(t.subject || '—')}<br/>
              <strong>Status:</strong> ${escapeHtml(t.status)}</p>
              ${t.snippet ? `<p style="color:#374151">"${escapeHtml(t.snippet)}"</p>` : ''}
              <p>Open the PiP Inbox to respond.</p>
            </div>`.trim();
          const mime = [
            `From: ${encodeHeader('Pilates in Pink ™')} <support@${STAFF_DOMAIN}>`,
            `To: ${t.assignee_email}`,
            `Subject: ${encodeHeader(subject)}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            html,
          ].join('\r\n');
          await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw: base64url(mime) }),
          });
        } catch (_) { /* non-fatal */ }
      }

      await db.Notification.create({
        recipient_email: t.assignee_email,
        type: 'reminder',
        title: `Pending ticket ${ticketTag}${t.contact_name || ''}`.trim(),
        body: t.subject || '',
        thread_id: t.id,
        source_app: 'support',
        is_read: false,
      });

      await db.Thread.update(t.id, { last_reminder_sent: new Date().toISOString() });
      remindersSent++;
    }

    return Response.json({ success: true, reminders_sent: remindersSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});