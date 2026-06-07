import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// In-memory throttle: max attempts per user within the window.
// Persists for the lifetime of the (warm) function instance.
const ATTEMPTS = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Per-user brute-force throttle.
    const now = Date.now();
    const rec = ATTEMPTS.get(user.id);
    if (rec && now - rec.first < WINDOW_MS && rec.count >= MAX_ATTEMPTS) {
      return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }
    if (!rec || now - rec.first >= WINDOW_MS) {
      ATTEMPTS.set(user.id, { first: now, count: 1 });
    } else {
      rec.count += 1;
    }

    const { password } = await req.json();

    if (!password) {
      return Response.json({ error: 'Missing password' }, { status: 400 });
    }

    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    if (!adminPassword) {
      return Response.json({ error: 'Admin password not configured' }, { status: 500 });
    }

    // Constant-time comparison to avoid timing side-channels, plus a small
    // delay to slow down brute-force attempts from authenticated users.
    const enc = new TextEncoder();
    const a = enc.encode(password);
    const b = enc.encode(adminPassword);
    let valid = a.length === b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) valid = false;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));

    return Response.json({ valid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});