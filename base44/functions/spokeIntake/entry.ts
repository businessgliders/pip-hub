import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * spokeIntake — server-to-server webhook called by the public spoke apps
 * (pip-support / pip-events / pip-partner) on every new form submission.
 *
 * Auth: Authorization: Bearer <SPOKE_INTAKE_SECRET>
 * Body: { source_app: "support"|"events"|"partner", name, email, phone, subject, ...anyOtherFields }
 *
 * Behavior:
 *  1. Upsert a Contact by email.
 *  2. Duplicate guard: ignore if a thread with same email + same spoke exists within 5 min.
 *  3. Create a Thread linked to the contact, storing all raw fields in form_data.
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const secret = Deno.env.get('SPOKE_INTAKE_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    const provided = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!secret || provided !== secret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { source_app, name, email, phone, subject, ...rest } = body;

    if (!source_app || !['support', 'events', 'influencer'].includes(source_app)) {
      return Response.json({ error: 'Invalid or missing source_app' }, { status: 400 });
    }
    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole.entities;
    const now = new Date();
    const nowIso = now.toISOString();
    const normalizedEmail = String(email).trim().toLowerCase();

    // 1. Upsert Contact by email
    const existingContacts = await db.Contact.filter({ email: normalizedEmail });
    let contact;
    if (existingContacts.length > 0) {
      contact = existingContacts[0];
      await db.Contact.update(contact.id, {
        name: name || contact.name,
        phone: phone || contact.phone,
        last_activity_at: nowIso,
      });
    } else {
      contact = await db.Contact.create({
        name: name || normalizedEmail,
        email: normalizedEmail,
        phone: phone || '',
        labels: [],
        last_activity_at: nowIso,
      });
    }

    // 2. Duplicate guard — same email + spoke within last 5 minutes
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const recent = await db.Thread.filter({
      contact_email: normalizedEmail,
      source_app: source_app,
    }, '-created_date', 5);
    const dupe = recent.find((t) => (t.created_date || '') >= fiveMinAgo);
    if (dupe) {
      return Response.json({ thread_id: dupe.id, contact_id: contact.id, duplicate: true });
    }

    // 3. Create Thread
    const snippet = (rest.message || rest.notes || subject || '')
      .toString()
      .slice(0, 140);

    const thread = await db.Thread.create({
      contact_id: contact.id,
      contact_email: normalizedEmail,
      contact_name: name || normalizedEmail,
      source_app,
      subject: subject || `New ${source_app} submission`,
      snippet,
      status: 'open',
      form_data: { name, email: normalizedEmail, phone, subject, ...rest },
      last_activity_at: nowIso,
      is_read: false,
      status_history: [{ status: 'open', changed_by: 'system', timestamp: nowIso }],
    });

    return Response.json({ thread_id: thread.id, contact_id: contact.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});