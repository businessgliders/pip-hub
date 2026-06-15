import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * sendBugReport — escalates a BugReport via Gmail to the dev/escalation
 * recipient and marks the report's email_status. Also assigns a sequential
 * bug_number (starting at 100) if one isn't set.
 *
 * Payload: { bug_report_id }
 */
const STAFF_DOMAIN = 'pilatesinpinkstudio.com';
const URGENCY_COLOR = { Critical: '#dc2626', High: '#ea580c', Soon: '#ca8a04', Low: '#16a34a' };

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

    const body = await req.json();
    const db = base44.asServiceRole.entities;

    // Two modes:
    //  (a) Legacy: { bug_report_id } — escalate an already-created report.
    //  (b) Live chat: full payload (description, urgency, …) — create then escalate.
    let report;
    let bug_report_id = body.bug_report_id;
    if (bug_report_id) {
      report = await db.BugReport.get(bug_report_id);
      if (!report) return Response.json({ error: 'Bug report not found' }, { status: 404 });
    } else {
      if (!body.description || !String(body.description).trim()) {
        return Response.json({ error: 'description required' }, { status: 400 });
      }
      report = await db.BugReport.create({
        title: body.title || String(body.description).slice(0, 80),
        description: body.description,
        urgency: body.urgency || 'Soon',
        platform: body.platform || 'Support Portal',
        client_name: body.client_name || '',
        booking_info: body.booking_info || '',
        image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
        reported_by_email: user.email,
        reported_by_name: body.rep_name || user.full_name || user.email,
        status: 'New',
        email_status: 'pending',
      });
      bug_report_id = report.id;
    }

    // Assign sequential bug number if missing.
    let bugNumber = report.bug_number;
    if (!bugNumber) {
      const latest = await db.BugReport.filter({}, '-bug_number', 1);
      const max = latest[0]?.bug_number || 99;
      bugNumber = Math.max(max, 99) + 1;
    }

    const escalationTo = Deno.env.get('BUG_REPORT_ESCALATION_TO') || '';
    if (!escalationTo) {
      await db.BugReport.update(bug_report_id, { bug_number: bugNumber, email_status: 'failed', email_error: 'BUG_REPORT_ESCALATION_TO not set' });
      return Response.json({ error: 'BUG_REPORT_ESCALATION_TO secret not set' }, { status: 400 });
    }

    const color = URGENCY_COLOR[report.urgency] || '#6b7280';
    const subject = `[Bug #${bugNumber}] ${report.title || 'Issue reported'}${report.client_name ? ` - ${report.client_name}` : ''}`;
    const imgs = (report.image_urls || []).map((u) => `<div><a href="${u}">${u}</a></div>`).join('');
    const html = `
      <div style="font-family:system-ui,Arial,sans-serif;color:#1f2937;line-height:1.6">
        <h2 style="margin:0 0 8px">Bug #${bugNumber}: ${escapeHtml(report.title || 'Issue reported')}</h2>
        <span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${color};color:#fff;font-size:12px;font-weight:600">${escapeHtml(report.urgency || 'Soon')}</span>
        <table style="margin:12px 0;border-collapse:collapse">
          <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Platform</td><td>${escapeHtml(report.platform || '—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Reported by</td><td>${escapeHtml(report.reported_by_name || report.reported_by_email || '—')}</td></tr>
          ${report.client_name ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Client</td><td>${escapeHtml(report.client_name)}</td></tr>` : ''}
          ${report.booking_info ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Booking</td><td>${escapeHtml(report.booking_info)}</td></tr>` : ''}
        </table>
        <p><strong>Description:</strong><br/>${escapeHtml(report.description || '—').replace(/\n/g, '<br/>')}</p>
        ${imgs ? `<p><strong>Attachments:</strong></p>${imgs}` : ''}
      </div>`.trim();

    let emailSent = false;
    let emailError = '';
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      const fromEmail = Deno.env.get('BUG_REPORT_FROM_EMAIL') || `support@${STAFF_DOMAIN}`;
      const mime = [
        `From: ${encodeHeader('Pilates in Pink ™')} <${fromEmail}>`,
        `To: ${escalationTo}`,
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

    await db.BugReport.update(bug_report_id, {
      bug_number: bugNumber,
      escalated_to: escalationTo,
      email_status: emailSent ? 'sent' : 'failed',
      email_error: emailError,
    });

    return Response.json({ success: true, bug_number: bugNumber, email_sent: emailSent, email_error: emailError });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});