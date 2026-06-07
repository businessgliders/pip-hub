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

    const valid = password === adminPassword;
    return Response.json({ valid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});