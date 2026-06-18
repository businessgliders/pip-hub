import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Daily maintenance: move Events threads whose event date is in the past to
// "Cancelled" — EXCEPT threads already in "Closed", "Hosted", or "Cancelled".
// Paced + retry-guarded to stay under the entity API rate limit.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const withRetry = async (fn) => {
      for (let attempt = 0; ; attempt++) {
        try { return await fn(); }
        catch (e) {
          const msg = String(e?.message || e);
          if (msg.includes('Rate limit') && attempt < 6) { await sleep(2000 * (attempt + 1)); continue; }
          throw e;
        }
      }
    };

    // Statuses that should NOT be auto-cancelled.
    const SKIP = new Set(['Closed', 'Hosted', 'Cancelled']);

    // Start of today (UTC) — anything strictly before this is "past".
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();

    const eventTime = (t) => {
      const raw = t?.form_data?.event_date || t?.form_data?.event_date_iso || t?.form_data?.date;
      const d = raw ? new Date(raw) : null;
      return d && !isNaN(d.getTime()) ? d.getTime() : null;
    };

    let scanned = 0;
    let cancelled = 0;
    const PAGE = 100;
    let skip = 0;
    while (true) {
      const batch = await withRetry(() => db.Thread.filter({ source_app: 'events' }, '-created_date', PAGE, skip));
      for (const t of batch) {
        scanned++;
        if (t.archived) continue;
        if (SKIP.has(t.status)) continue;
        const et = eventTime(t);
        if (et === null || et >= todayMs) continue; // no date or future/today

        const entry = {
          status: 'Cancelled',
          changed_by: 'system',
          name: 'Automated',
          note: 'Auto-cancelled: event date has passed',
          timestamp: new Date().toISOString(),
        };
        await withRetry(() => db.Thread.update(t.id, {
          status: 'Cancelled',
          status_history: [...(t.status_history || []), entry],
        }));
        cancelled++;
        await sleep(150);
      }
      if (batch.length < PAGE) break;
      skip += PAGE;
      await sleep(300);
    }

    return Response.json({ success: true, scanned, cancelled });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});