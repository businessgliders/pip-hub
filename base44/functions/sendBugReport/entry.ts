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

function buildBugHtml(report) {
  const urgencyColor = URGENCY_COLOR[report.urgency] || '#6b7280';
  const imagesHtml = (report.image_urls || []).length
    ? `<h3 style="margin:18px 0 8px;font-size:14px;color:#334155;">📎 Attachments</h3>
       <div>${report.image_urls.map((u, i) => `
         <div style="margin:8px 0;">
           <a href="${escapeHtml(u)}" style="color:#2563eb;text-decoration:underline;font-size:13px;">Attachment ${i + 1} Link</a>
         </div>
       `).join('')}</div>`
    : '';

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;background:#ffffff;padding:24px;">
    <div style="border-left:4px solid ${urgencyColor};padding-left:14px;margin-bottom:18px;">
      <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#64748b;">Issue ${report.bug_number ? `B${report.bug_number} • ` : ''}${escapeHtml(report.urgency || 'Soon')}</div>
      <h1 style="margin:4px 0 0;font-size:22px;color:#0f172a;">${escapeHtml(report.title || 'New issue reported')}</h1>
    </div>

    <table style="width:100%;font-size:13px;color:#0f172a;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#64748b;width:140px;">Platform</td><td>${escapeHtml(report.platform || '—')}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Urgency</td><td><span style="display:inline-block;padding:2px 8px;border-radius:9999px;background:${urgencyColor}1a;color:${urgencyColor};font-weight:600;font-size:12px;">${escapeHtml(report.urgency || '—')}</span></td></tr>
      <tr><td style="padding:4px 0;color:#64748b;">Reported by</td><td>${escapeHtml(report.reported_by_name || report.reported_by_email || '—')}</td></tr>
      ${report.ticket_number ? `<tr><td style="padding:4px 0;color:#64748b;">Related Ticket</td><td><strong>#${escapeHtml(report.ticket_number)}</strong></td></tr>` : ''}
      ${report.client_name ? `<tr><td style="padding:4px 0;color:#64748b;">Client</td><td>${escapeHtml(report.client_name)}</td></tr>` : ''}
      ${report.booking_info ? `<tr><td style="padding:4px 0;color:#64748b;">Booking</td><td>${escapeHtml(report.booking_info)}</td></tr>` : ''}
    </table>

    <h3 style="margin:18px 0 8px;font-size:14px;color:#334155;">📝 Description</h3>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;font-size:13px;color:#0f172a;white-space:pre-wrap;font-style:italic;">${escapeHtml(report.description || '—')}</div>

    ${imagesHtml}

    <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
      Sent automatically from PiP Support Portal • Bug Report ID: ${escapeHtml(report.id || 'n/a')}
    </div>
  </div>`;
}

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

    // Build a short 2-3 word AI summary for the subject line. The full title
    // still appears in the email body. Reuse a previously-generated summary so
    // re-sends keep the same subject (and Gmail thread).
    let subjectSummary = report.subject_summary || '';
    if (!subjectSummary) {
      try {
        const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Summarize this software bug in 2-3 words for an email subject line. Title case, no punctuation, no quotes. Just the phrase.\n\nTitle: ${report.title || ''}\nDescription: ${report.description || ''}`,
        });
        subjectSummary = String(ai || '').trim().replace(/^["']|["']$/g, '').split('\n')[0].slice(0, 40);
      } catch (_) { /* fall back to title below */ }
    }
    const subjectText = subjectSummary || report.title || 'Issue reported';
    const subject = `[Bug #${bugNumber}] ${subjectText}${report.client_name ? ` - ${report.client_name}` : ''}`;
    const html = buildBugHtml({ ...report, bug_number: bugNumber }).trim();
    const fromEmail = Deno.env.get('BUG_REPORT_FROM_EMAIL') || `support@${STAFF_DOMAIN}`;
    // Generate our own RFC Message-ID so inbound replies can be threaded back.
    const domain = (fromEmail.split('@')[1] || STAFF_DOMAIN);
    const rfcMessageId = `<bug-${bugNumber}-${Date.now()}@${domain}>`;

    let emailSent = false;
    let emailError = '';
    let gmailThreadId = '';
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
      const mime = [
        `From: ${encodeHeader('Report Bug @ Pilates in Pink ™')} <${fromEmail}>`,
        `To: ${escalationTo}, support@gokenko.com`,
        `Subject: ${encodeHeader(subject)}`,
        `Message-ID: ${rfcMessageId}`,
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
      if (res.ok) {
        const sent = await res.json().catch(() => ({}));
        gmailThreadId = sent.threadId || '';
      } else {
        emailError = (await res.text()).slice(0, 300);
      }
    } catch (e) {
      emailError = e.message;
    }

    await db.BugReport.update(bug_report_id, {
      bug_number: bugNumber,
      escalated_to: escalationTo,
      subject_summary: subjectSummary,
      email_status: emailSent ? 'sent' : 'failed',
      email_error: emailError,
      rfc_message_id: rfcMessageId,
      gmail_thread_id: gmailThreadId,
    });

    // Notify all staff of the new bug report so it shows in the notification bell
    // (Bugs group). Bug reports have no assignee, so fan out to all admins.
    try {
      const admins = await db.User.filter({ role: 'admin' });
      const recipients = admins.map((u) => u.email).filter(Boolean);
      const reporter = report.reported_by_name || report.reported_by_email || 'Someone';
      await Promise.all(
        recipients.map((rEmail) => db.Notification.create({
          type: 'bug',
          title: `New bug report B${bugNumber}: ${report.title || 'Issue reported'}`.slice(0, 120),
          body: `${reporter}: ${report.description || ''}`.slice(0, 160),
          source_app: 'support',
          thread_id: bug_report_id,
          is_read: false,
          recipient_email: rEmail,
        }))
      );
    } catch (_) { /* non-fatal */ }

    return Response.json({ success: true, bug_number: bugNumber, email_sent: emailSent, email_error: emailError });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});