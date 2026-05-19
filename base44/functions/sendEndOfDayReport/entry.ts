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

const buildHtml = (r) => {
  const pink = '#f1889b';
  const pinkLight = '#fbe0e2';
  const text = '#374151';
  const muted = '#6b7280';
  const location = r.location || 'Brampton / HQ';

  const stat = (label, value) => `
    <td align="center" style="padding:14px 8px;background:#ffffff;border:1px solid #f3e8eb;border-radius:14px;">
      <div style="font-size:11px;font-weight:600;color:${muted};text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</div>
      <div style="font-size:24px;font-weight:700;color:${pink};margin-top:4px;">${esc(value ?? 0)}</div>
    </td>`;

  const row = (label, value) => `
    <tr>
      <td style="padding:10px 14px;background:#fafafa;border-bottom:1px solid #f1f5f9;width:40%;font-size:13px;color:${muted};font-weight:500;">${esc(label)}</td>
      <td style="padding:10px 14px;background:#ffffff;border-bottom:1px solid #f1f5f9;font-size:14px;color:${text};">${esc(value || '—')}</td>
    </tr>`;

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
              ${row('Incidents', r.incidents)}
              ${row('Client feedback', r.feedback)}
              ${row('General notes', r.general_notes)}
            </table>`)}
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

const buildMime = async ({ from, to, subject, html }) => {
  const transport = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
  const fromEncoded = from.includes('<') 
    ? from.replace(/^([^<]+)/, (name) => encodeRFC2047(name.trim()))
    : from;
  const info = await transport.sendMail({ from: fromEncoded, to, subject, html });
  return info.message.toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { report } = await req.json();
    if (!report) return Response.json({ error: 'Missing report' }, { status: 400 });

    const r = { ...report, location: report.location || 'Brampton / HQ' };
    const html = buildHtml(r);
    const subject = `End of Day Report — ${formatDate(r.shift_date)} · ${r.location} · ${r.admin_name || ''}`.trim();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const raw = await buildMime({
      from: `${STORE_NAME} <me@gmail.com>`,
      to: 'gurpreen@pilatesinpinkstudio.com',
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