import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
// @ts-ignore
import nodemailer from 'npm:nodemailer@6.9.14';

const STORE_NAME = 'Pilates in Pink \u2122';
const PINK = '#f1889b';
const PINK_LIGHT = '#fbe0e2';
const TEXT = '#374151';
const MUTED = '#6b7280';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const fmtRange = (start, end) => {
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
};

const buildAiSummary = async (base44, reports) => {
  const items = reports.map(r => ({
    date: r.shift_date,
    admin: r.admin_name,
    conversion_notes: r.conversion_notes,
    low_inventory: r.low_inventory_items,
    incidents: r.incidents || (r.incidents_list || []).join('; '),
    feedback: r.feedback || (r.feedback_list || []).join('; '),
    general_notes: r.general_notes,
  })).filter(i => i.conversion_notes || i.low_inventory || i.incidents || i.feedback || i.general_notes);

  if (items.length === 0) return null;

  return await base44.integrations.Core.InvokeLLM({
    prompt: `You are analyzing end-of-day shift reports for a Pilates studio for the past week. Each report has an "admin" field — the submitter who wrote it. Summarize the trends and most commonly reported items across these categories: incidents, client feedback, low inventory items, conversion blockers (why leads didn't convert), and general notes. For each reported item, attribute WHICH submitter(s) reported it. Also provide a per-submitter breakdown. Identify recurring themes. Be specific and actionable.\n\nReports:\n${JSON.stringify(items, null, 2)}`,
    response_json_schema: {
      type: 'object',
      properties: {
        overview: { type: 'string' },
        common_incidents: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' }, submitters: { type: 'array', items: { type: 'string' } } } } },
        common_feedback: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' }, submitters: { type: 'array', items: { type: 'string' } } } } },
        common_inventory: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' }, submitters: { type: 'array', items: { type: 'string' } } } } },
        conversion_blockers: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, count: { type: 'number' }, submitters: { type: 'array', items: { type: 'string' } } } } },
        by_submitter: { type: 'array', items: { type: 'object', properties: { submitter: { type: 'string' }, report_count: { type: 'number' }, summary: { type: 'string' }, key_items: { type: 'array', items: { type: 'string' } } } } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  });
};

const buildHtml = ({ reports, totals, ai, rangeLabel, daily, maxDaily, appUrl }) => {
  const reportsUrl = `${appUrl}/end-of-day`;

  const stat = (label, value) => `
    <td align="center" style="padding:14px 8px;background:#ffffff;border:1px solid #f3e8eb;border-radius:14px;">
      <div style="font-size:11px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:0.5px;">${esc(label)}</div>
      <div style="font-size:24px;font-weight:700;color:${PINK};margin-top:4px;">${esc(value ?? 0)}</div>
    </td>`;

  // Simple HTML bar chart (calls per day) — a "snapshot" of analytics
  const bars = daily.map(d => {
    const h = maxDaily > 0 ? Math.round((d.calls / maxDaily) * 90) : 0;
    return `
      <td align="center" valign="bottom" style="padding:0 3px;">
        <div style="height:90px;display:flex;align-items:flex-end;justify-content:center;">
          <div style="width:18px;height:${Math.max(h, 2)}px;background:${PINK};border-radius:4px 4px 0 0;"></div>
        </div>
        <div style="font-size:9px;color:${MUTED};margin-top:4px;">${esc(d.label)}</div>
        <div style="font-size:10px;font-weight:700;color:${TEXT};">${d.calls}</div>
      </td>`;
  }).join('');

  const themeList = (title, list) => {
    if (!list || list.length === 0) return '';
    const rows = list.slice(0, 6).map(it => `
      <tr>
        <td style="padding:7px 12px;font-size:13px;color:${TEXT};border-bottom:1px solid #f5f5f5;">${esc(it.item)}</td>
        <td align="right" style="padding:7px 12px;font-size:11px;color:${MUTED};border-bottom:1px solid #f5f5f5;white-space:nowrap;">${esc((it.submitters || []).join(', '))}${it.count > 1 ? ` · ${it.count}×` : ''}</td>
      </tr>`).join('');
    return `
      <div style="margin-top:18px;">
        <div style="font-size:11px;font-weight:700;color:${PINK};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${esc(title)}</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f1f5f9;border-radius:12px;overflow:hidden;background:#fff;">${rows}</table>
      </div>`;
  };

  const submitterBlocks = (ai?.by_submitter || []).map(s => `
    <div style="background:#ffffff;border:1px solid #f1f5f9;border-radius:12px;padding:12px 14px;margin-bottom:8px;">
      <div style="font-size:14px;font-weight:700;color:#1f2937;">${esc(s.submitter)} <span style="font-size:11px;font-weight:500;color:${MUTED};">· ${s.report_count} report${s.report_count === 1 ? '' : 's'}</span></div>
      <div style="font-size:13px;color:${TEXT};margin-top:4px;line-height:1.5;">${esc(s.summary)}</div>
      ${(s.key_items || []).length ? `<div style="margin-top:6px;">${s.key_items.map(k => `<span style="display:inline-block;font-size:11px;background:${PINK_LIGHT};color:#c45a6e;border-radius:999px;padding:2px 8px;margin:2px 4px 0 0;">${esc(k)}</span>`).join('')}</div>` : ''}
    </div>`).join('');

  const recs = (ai?.recommendations || []).map(r => `
    <li style="font-size:13px;color:${TEXT};margin-bottom:6px;line-height:1.5;"><span style="color:${PINK};">•</span> ${esc(r)}</li>`).join('');

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px rgba(241,136,155,0.08);">

        <tr><td style="background:linear-gradient(135deg, ${PINK_LIGHT} 0%, #ffffff 100%);padding:28px 32px;">
          <div style="font-size:13px;font-weight:600;color:${PINK};letter-spacing:2px;text-transform:uppercase;">${esc(STORE_NAME)}</div>
          <h1 style="margin:6px 0 4px 0;font-size:26px;font-weight:800;color:#1f2937;">Weekly Exec Report</h1>
          <div style="font-size:14px;color:${MUTED};">${esc(rangeLabel)} · ${totals.reports} reports</div>
        </td></tr>

        <tr><td style="padding:24px 32px 0 32px;">
          <div style="font-size:12px;font-weight:700;color:${PINK};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Weekly Snapshot</div>
          <table width="100%" cellpadding="6" cellspacing="0">
            <tr>
              ${stat('Calls', totals.calls)}
              ${stat('Emails', totals.emails)}
              ${stat('Walk-ins', totals.walkIns)}
            </tr>
            <tr>
              ${stat('Converted', totals.converted)}
              ${stat('Reviews', totals.reviews)}
              ${stat('Social Days', totals.social)}
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px 0 32px;">
          <div style="font-size:12px;font-weight:700;color:${PINK};text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Calls by Day</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #f1f5f9;border-radius:14px;padding:14px 8px;">
            <tr>${bars || '<td style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">No data</td>'}</tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px 0 32px;">
          <div style="font-size:12px;font-weight:700;color:${PINK};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">AI Summary</div>
          ${ai ? `<div style="font-size:14px;color:${TEXT};line-height:1.6;">${esc(ai.overview)}</div>
          ${themeList('Common incidents', ai.common_incidents)}
          ${themeList('Client feedback', ai.common_feedback)}
          ${themeList('Low inventory', ai.common_inventory)}
          ${themeList('Conversion blockers', ai.conversion_blockers)}
          ${submitterBlocks ? `<div style="margin-top:18px;"><div style="font-size:11px;font-weight:700;color:${PINK};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">By Submitter</div>${submitterBlocks}</div>` : ''}
          ${recs ? `<div style="margin-top:18px;"><div style="font-size:11px;font-weight:700;color:${PINK};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Recommendations</div><ul style="margin:0;padding-left:0;list-style:none;">${recs}</ul></div>` : ''}`
          : `<div style="font-size:14px;color:${MUTED};">No notes were submitted this week.</div>`}
        </td></tr>

        <tr><td style="padding:0 32px;">
          <div style="text-align:center;margin:32px 0 8px 0;">
            <a href="${esc(reportsUrl)}" style="display:inline-block;background:linear-gradient(135deg, ${PINK} 0%, #f7b1bd 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(241,136,155,0.3);">Open Analytics →</a>
          </div>
        </td></tr>

        <tr><td style="padding:24px 32px 28px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <div style="font-size:11px;color:${MUTED};letter-spacing:1px;text-transform:uppercase;">${esc(STORE_NAME)} Studio</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:4px;">Automated weekly exec report · ${esc(new Date().toLocaleDateString())}</div>
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
  return info.message.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled (service) invocation; if a user is present, require admin.
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const execEmails = (Deno.env.get('EXEC_EMAILS') || '')
      .split(',').map(e => e.trim()).filter(Boolean);
    if (execEmails.length === 0) {
      return Response.json({ error: 'EXEC_EMAILS not set' }, { status: 400 });
    }

    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const startStr = start.toISOString().slice(0, 10);

    const all = await base44.asServiceRole.entities.ShiftReport.list('-shift_date', 500);
    const reports = all.filter(r => r.shift_date && r.shift_date >= startStr);

    const totals = {
      reports: reports.length,
      calls: reports.reduce((s, r) => s + (r.calls_handled || 0), 0),
      emails: reports.reduce((s, r) => s + (r.total_emails || 0), 0),
      walkIns: reports.reduce((s, r) => s + (r.total_walk_ins || 0), 0),
      converted: reports.reduce((s, r) => s + (r.leads_converted || 0), 0),
      reviews: reports.reduce((s, r) => s + (r.reviews_solicited || 0), 0),
      social: reports.filter(r => r.posted_social_media).length,
    };

    // Daily calls breakdown for the snapshot chart (last 7 days)
    const dayMap = {};
    reports.forEach(r => {
      dayMap[r.shift_date] = (dayMap[r.shift_date] || 0) + (r.calls_handled || 0);
    });
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      daily.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), calls: dayMap[key] || 0 });
    }
    const maxDaily = Math.max(0, ...daily.map(d => d.calls));

    const ai = await buildAiSummary(base44, reports);

    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://app.base44.com';
    const appUrl = origin.replace(/\/$/, '');
    const rangeLabel = fmtRange(start, end);

    const html = buildHtml({ reports, totals, ai, rangeLabel, daily, maxDaily, appUrl });
    const subject = `Weekly Exec Report — ${rangeLabel} · ${totals.reports} reports`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const raw = await buildMime({
      from: `${STORE_NAME} <frontdesk@pilatesinpinkstudio.com>`,
      to: execEmails.join(', '),
      subject,
      html,
    });

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gmail send failed', res.status, errText);
      return Response.json({ error: 'Gmail send failed', details: errText }, { status: 500 });
    }

    return Response.json({ success: true, sentTo: execEmails, reports: totals.reports });
  } catch (error) {
    console.error('sendWeeklyExecReport error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});