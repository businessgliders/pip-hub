import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * getStaffList — returns staff members (id, full_name, email) for the
 * assignee dropdown in the Unified Inbox. Admin-only because it exposes
 * real (unmasked) email addresses, unlike the public getAllUsers picker.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const staff = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name || u.email,
      photo_url: u.photo_url || u.avatar_url || null,
    }));

    return Response.json({ staff });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});