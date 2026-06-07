import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
// @ts-ignore
import nodemailer from 'npm:nodemailer@6.9.14';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const formatDate = (d) => {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return d; }
};

const STORE_NAME = 'Pilates in Pink \u2122';

const buildHtml = (r, appUrl) => {
  const pink = '#f1889b';
  const pinkLight = '#fbe0e2';
  const text = '#374151';
  const muted = '#6b7280';
  const location = r.location || 'Brampton / HQ';
  const reportsUrl = `${appUrl}/end-of-day`;

  const stat = (label, value) => `
    <td align="center" style="padding:14px 8px;background:#ffffff;border:1px solid #f3e8eb;border-radius:14px;">
      <div style="font-size:11px;font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</div>
      <div style="font-size:24px;font-weight:700;color:${pink};margin-top:4px;">${esc(value ?? 0)}</div>
    </td>`;

  const row = (label, value) => `
    <tr>
      <td style="padding:10px 14px;background:#fafafa;border-bottom:1px solid #f1f5f9;width:40%;font-size:13px;color:${muted};font-weight:500;vertical-align:top;">${esc(label)}</td>
      <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;font-size:14px;color:${text};">${esc(value || '—')}</td>
    </tr>`;

  const listRow = (label, items, fallback) => {
    const arr = Array.isArray(items) ? items.filter(Boolean) : [];
    if (arr.length === 0) {
      return row(label, fallback || '—');
    }
    const li = arr.map((it, i) => `
      <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:${i === arr.length - 1 ? 'none' : '1px dashed #f1f5f9'};">
        <span style="display:inline-block;min-width:20px;height:20px;line-height:20px;text-align:center;background:${pinkLight};color:${pink};font-size:11px;font-weight:700;border-radius:999px;">${i + 1}</span>
        <span style="font-size:14px;color:${text};">${esc(it)}</span>
      </div>`).join('');
    return `
      <tr>
        <td style="padding:10px 14px;background:#fafafa;border-bottom:1px solid #f1f5f9;width:40%;font-size:13px;color:${muted};font-weight:500;vertical-align:top;">${esc(label)}</td>
        <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;">${li}</td>
      </tr>`;
  };

  const section = (title, content) => `
    <div style="margin-top:24px;">
      <div style="font-size:12px;font-weight:700;color:${pink};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">${title}</div>
      ${content}
    </div>`;

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${text};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px rgba(241,136,155,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg, ${pinkLight} 0%, #ffffff 100%);padding:28px 32px;">
          <div style="font-size:13px;font-weight:600;color:${pink};letter-spacing:2px;text-transform:uppercase;">${esc(STORE_NAME)}</div>
          <h1 style="margin:6px 0 4px 0;font-size:26px;font-weight:800;color:#1f2937;">End of Day Report</h1>
          <div style="font-size:14px;color:${muted};">${esc(formatDate(r.shift_date))} · ${esc(r.shift_time)}</div>
          <div style="font-size:13px;color:${pink};margin-top:6px;font-weight:600;">📍 ${esc(location)}</div>
        </td></tr>

        <!-- Submitted by -->
        <tr><td style="padding:20px 32px 0 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${pinkLight};border-radius:14px;padding:14px 16px;">
            <tr>
              <td style="font-size:12px;color:${muted};">Front Desk Admin</td>
              <td align="right" style="font-size:14px;font-weight:600;color:#1f2937;">${esc(r.admin_name)}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:${muted};padding-top:6px;">Location</td>
              <td align="right" style="font-size:14px;font-weight:600;color:#1f2937;padding-top:6px;">${esc(location)}</td>
            </tr>
            <tr>
              <td style="font-size:12px;color:${muted};padding-top:6px;">Signed by</td>
              <td align="right" style="font-size:14px;font-style:italic;color:#1f2937;padding-top:6px;">${esc(r.signature)}</td>
            </tr>
          </table>
        </td></tr>

        <!-- Stats grid -->
        <tr><td style="padding:24px 32px 0 32px;">
          <div style="font-size:12px;font-weight:700;color:${pink};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Daily Snapshot</div>
          <table width="100%" cellpadding="6" cellspacing="0">
            <tr>
              ${stat('Calls', r.calls_handled)}
              ${stat('Emails', r.total_emails)}
              ${stat('Walk-ins', r.total_walk_ins)}
            </tr>
            <tr>
              ${stat('Converted', r.leads_converted)}
              ${stat('Reviews', r.reviews_solicited)}
              ${stat('Social', r.posted_social_media ? '✓' : '—')}
            </tr>
          </table>
        </td></tr>

        <!-- Details -->
        <tr><td style="padding:0 32px 8px 32px;">
          ${section('Communication', `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #f1f5f9;">
              ${row('Conversion notes', r.conversion_notes)}
            </table>`)}

          ${section('Social Media', `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #f1f5f9;">
              ${row('Posted today', r.posted_social_media ? 'Yes' : 'No')}
              ${row('Content planned', r.content_planned)}
            </table>`)}

          ${section('Inventory', `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #f1f5f9;">
              ${row('Low stock items', r.low_inventory_items)}
            </table>`)}

          ${section('Notes & Feedback', `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #f1f5f9;">
              ${listRow('Incidents', r.incidents_list, r.incidents)}
              ${listRow('Client feedback', r.feedback_list, r.feedback)}
              ${row('General notes', r.general_notes)}
            </table>`)}

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0 8px 0;">
            <a href="${esc(reportsUrl)}" style="display:inline-block;background:linear-gradient(135deg, ${pink} 0%, #f7b1bd 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;letter-spacing:0.3px;box-shadow:0 4px 12px rgba(241,136,155,0.3);">
              View All Reports →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 32px 28px 32px;text-align:center;border-top:1px solid #f3f4f6;margin-top:24px;">
          <div style="font-size:11px;color:${muted};letter-spacing:1px;text-transform:uppercase;">${esc(STORE_NAME)} Studio · ${esc(location)}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Automated daily report · ${esc(new Date().toLocaleDateString())}</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
};

const encodeRFC2047 = (text) => {
  const buf = new TextEncoder().encode(text);
  const b64 = btoa(String.fromCharCode(...buf));
  return `=?UTF-8?B?${b64}?=`;
};

const buildMime = async ({ from, to, cc, subject, html }) => {
  const transport = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
  const fromEncoded = from.includes('<') 
    ? from.replace(/^([^<]+)/, (name) => encodeRFC2047(name.trim()))
    : from;
  const info = await transport.sendMail({ from: fromEncoded, to, cc, subject, html });
  return info.message.toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Intentionally open to any authenticated studio user: front-desk staff
    // (non-admin) legitimately submit and send their own End-of-Day reports.
    // Recipients are fixed via EOD_REPORT_TO/CC env vars, so the report can only
    // ever be delivered to the pre-configured studio addresses — an authenticated
    // user cannot redirect it elsewhere.

    const { report } = await req.json();
    if (!report) return Response.json({ error: 'Missing report' }, { status: 400 });

    const r = { ...report, location: report.location || 'Brampton / HQ' };
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://app.base44.com';
    const appUrl = origin.replace(/\/$/, '');
    const html = buildHtml(r, appUrl);
    const subject = `End of Day Report — ${formatDate(r.shift_date)} · ${r.location} · ${r.admin_name || ''}`.trim();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Recipients are configurable via environment variables.
    // EOD_REPORT_TO / EOD_REPORT_CC accept comma-separated addresses.
    const fromAddress = Deno.env.get('EOD_REPORT_FROM') || 'frontdesk@pilatesinpinkstudio.com';
    const toRecipients = Deno.env.get('EOD_REPORT_TO');
    const ccRecipients = Deno.env.get('EOD_REPORT_CC');

    if (!toRecipients) {
      return Response.json({ error: 'EOD_REPORT_TO is not configured' }, { status: 500 });
    }

    const raw = await buildMime({
      from: `${STORE_NAME} <${fromAddress}>`,
      to: toRecipients,
      cc: ccRecipients || undefined,
      subject,
      html,
    });

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gmail send failed', res.status, errText);
      return Response.json({ error: 'Gmail send failed', details: errText }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendEndOfDayReport error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});