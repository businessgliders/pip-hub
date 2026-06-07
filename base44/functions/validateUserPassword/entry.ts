import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
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