import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * backfillInfluencerDates — one-time backfill of the real submission date/time
 * onto existing influencer Threads, using a CSV exported from pip-partner.
 *
 * Payload: { csv_url, dry_run?, max_ops? }
 *
 * Matching (in priority order, per CSV row):
 *   1. ticket number  (CSV: display_ticket_number | ticket_number | app_number)
 *      matched against Thread.ticket_number
 *   2. email          (CSV: email) — if several threads share the email, the
 *      EARLIEST-created one is patched.
 *
 * Date column auto-detected from common header names. For each matched thread
 * we set last_activity_at AND form_data.submitted_date to the parsed date.
 *
 * Idempotent-ish: re-running just re-sets the same dates. Admin-only.
 */

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function toObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => (h || '').trim());
  return rows.slice(1).filter((r) => r.length > 1).map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = r[i] ?? ''; });
    return o;
  });
}

// Pull the first non-empty value from a row across a list of candidate headers
// (case-insensitive).
function pick(row, candidates) {
  const lowerMap = {};
  for (const k of Object.keys(row)) lowerMap[k.toLowerCase()] = row[k];
  for (const c of candidates) {
    const v = lowerMap[c.toLowerCase()];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

const DATE_KEYS = [
  'submitted_date', 'submission_date', 'submitted_at', 'submittedAt',
  'submission_datetime', 'date_submitted', 'created_date', 'created_at',
  'createdAt', 'created', 'date', 'timestamp', 'submitted',
];
const TICKET_KEYS = ['display_ticket_number', 'ticket_number', 'app_number', 'ticket', 'number'];
const EMAIL_KEYS = ['email', 'contact_email', 'submitter_email'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { csv_url, dry_run, max_ops = 200 } = await req.json();
    if (!csv_url) return Response.json({ error: 'Missing csv_url' }, { status: 400 });

    const csvText = await fetch(csv_url).then((r) => r.text());
    const rows = toObjects(parseCSV(csvText));

    const db = base44.asServiceRole.entities;
    const threads = await db.Thread.filter({ source_app: 'influencer' }, 'created_date', 5000);

    // Index threads by ticket_number and by email (earliest first since the
    // list is sorted ascending by created_date).
    const byTicket = {};
    const byEmail = {};
    for (const t of threads) {
      if (typeof t.ticket_number === 'number') byTicket[t.ticket_number] = byTicket[t.ticket_number] || t;
      const e = (t.contact_email || '').toLowerCase();
      if (e) { (byEmail[e] = byEmail[e] || []).push(t); }
    }

    const summary = {
      csv_rows: rows.length,
      threads_total: threads.length,
      matched_by_ticket: 0,
      matched_by_email: 0,
      no_match: 0,
      no_date: 0,
      updated: 0,
    };
    const preview = [];
    const usedThreadIds = new Set();
    let ops = 0;

    for (const row of rows) {
      const rawDate = pick(row, DATE_KEYS);
      const ticketStr = pick(row, TICKET_KEYS);
      const email = pick(row, EMAIL_KEYS).toLowerCase();

      if (!rawDate) { summary.no_date++; continue; }
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) { summary.no_date++; continue; }
      const iso = d.toISOString();

      // 1. Match by ticket number
      let thread = null;
      const ticketNum = ticketStr ? Number(String(ticketStr).replace(/[^0-9]/g, '')) : NaN;
      if (!isNaN(ticketNum) && byTicket[ticketNum] && !usedThreadIds.has(byTicket[ticketNum].id)) {
        thread = byTicket[ticketNum];
        if (thread) summary.matched_by_ticket++;
      }
      // 2. Fall back to email (earliest unused thread for that contact)
      if (!thread && email && byEmail[email]) {
        thread = byEmail[email].find((t) => !usedThreadIds.has(t.id)) || null;
        if (thread) summary.matched_by_email++;
      }
      if (!thread) { summary.no_match++; continue; }
      usedThreadIds.add(thread.id);

      if (preview.length < 25) {
        preview.push({
          ticket_number: thread.ticket_number,
          email: thread.contact_email,
          name: thread.contact_name,
          old_date: thread.last_activity_at,
          new_date: iso,
          matched_by: ticketStr && byTicket[ticketNum] ? 'ticket' : 'email',
        });
      }

      if (dry_run) continue;

      await db.Thread.update(thread.id, {
        last_activity_at: iso,
        form_data: { ...(thread.form_data || {}), submitted_date: iso },
      });
      summary.updated++; ops++;
      await sleep(150);
      if (ops >= max_ops) {
        return Response.json({ success: true, done: false, note: 'max_ops reached — re-run to continue', summary, preview });
      }
    }

    return Response.json({ success: true, done: true, dry_run: !!dry_run, summary, preview });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});