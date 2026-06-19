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

const STORE_NAME = 'Pilates in Pink \u2122';
const SOURCE_LABEL = { support: 'Support', events: 'Events', influencer: 'Partner' };

// Branded reminder email matching the assignment email design, with a deep
// link that opens the inbox directly on the ticket (?assigned=1 triggers the
// thread-row shake animation on arrival).
function buildReminderHtml({ thread, ticketTag, ticketUrl }) {
  const pink = '#f1889b';
  const pinkLight = '#fbe0e2';
  const text = '#374151';
  const muted = '#6b7280';
  const inbox = SOURCE_LABEL[thread.source_app] || thread.source_app || '—';

  const row = (label, value) => `
    <tr>
      <td style="padding:10px 14px;background:#fafafa;border-bottom:1px solid #f1f5f9;width:38%;font-size:13px;color:${muted};font-weight:500;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;font-size:14px;color:${text};">${value}</td>
    </tr>`;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px rgba(241,136,155,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg, ${pinkLight} 0%, #ffffff 100%);padding:28px 32px;">
          <div style="font-size:13px;font-weight:600;color:${pink};letter-spacing:2px;text-transform:uppercase;">${escapeHtml(STORE_NAME)}</div>
          <h1 style="margin:6px 0 4px 0;font-size:24px;font-weight:800;color:#1f2937;">⏰ A ticket is still waiting</h1>
          <div style="font-size:14px;color:${muted};">This ticket is assigned to you and needs attention.</div>
        </td></tr>

        <!-- Details -->
        <tr><td style="padding:24px 32px 0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #f1f5f9;">
            ${row('Ticket', `<strong style="color:${pink};">${ticketTag || '—'}</strong>`)}
            ${row('Subject', escapeHtml(thread.subject || '—'))}
            ${row('Contact', escapeHtml(thread.contact_name || thread.contact_email || '—'))}
            ${row('Status', escapeHtml(thread.status || '—'))}
            ${row('Inbox', escapeHtml(inbox))}
          </table>
          ${thread.snippet ? `<div style="margin-top:16px;padding:14px 16px;background:${pinkLight};border-radius:14px;font-size:14px;color:#1f2937;font-style:italic;">"${escapeHtml(thread.snippet)}"</div>` : ''}

          <!-- CTA Button -->
          <div style="text-align:center;margin:28px 0 8px 0;">
            <a href="${escapeHtml(ticketUrl)}" style="display:inline-block;background:linear-gradient(135deg, ${pink} 0%, #f7b1bd 100%);color:#ffffff;text-decoration:none;padding:14px 30px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(241,136,155,0.3);">
              Open this ticket →
            </a>
          </div>
          <div style="text-align:center;font-size:12px;color:#9ca3af;margin-bottom:8px;">Opens the PiP Inbox right on this conversation.</div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px 28px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <div style="font-size:11px;color:${muted};letter-spacing:1px;text-transform:uppercase;">${escapeHtml(STORE_NAME)} · PiP Inbox</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Automated ticket reminder</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
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
          // Deep link straight to the ticket; ?assigned=1 triggers the
          // thread-row shake animation when the inbox opens it.
          const ticketUrl = `https://inbox.pilatesinpinkstudio.com/inbox?thread=${t.id}&assigned=1#${t.source_app || 'support'}`;
          const html = buildReminderHtml({ thread: t, ticketTag: ticketTag.trim(), ticketUrl });
          const mime = [
            `From: ${encodeHeader('Support @ Pilates in Pink ™')} <support@${STAFF_DOMAIN}>`,
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