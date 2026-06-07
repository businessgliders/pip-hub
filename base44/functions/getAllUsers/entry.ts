import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const OWNER_EMAIL = 'info@pilatesinpinkstudio.com';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // INTENTIONAL DESIGN: this app uses a "pick your tile" login screen, so any
    // authenticated user must be able to see the staff roster to select themselves.
    // To limit information disclosure we (a) require authentication, and
    // (b) return the absolute minimum fields and MASK the email address — the
    // full plaintext email never leaves the backend.
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const maskEmail = (email) => {
      if (!email || !email.includes('@')) return email;
      const [local, domain] = email.split('@');
      const head = local.slice(0, 1);
      return `${head}***@${domain}`;
    };

    const allUsers = await base44.asServiceRole.entities.User.list();

    // Return only the minimal fields needed to render the user picker.
    // `email` is masked; `is_owner` lets the client sort/label the owner tile
    // without exposing real addresses.
    const users = allUsers.map(u => ({
      id: u.id,
      email: maskEmail(u.email),
      full_name: u.full_name,
      is_owner: u.email === OWNER_EMAIL,
    }));

    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});