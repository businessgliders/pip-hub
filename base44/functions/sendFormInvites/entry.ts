import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Per-inbox "from" address + label for personalized invite emails.
const FROM_BY_APP = {
  support: { email: 'support@pilatesinpinkstudio.com', name: 'Pilates in Pink — Support' },
  events: { email: 'events@pilatesinpinkstudio.com', name: 'Pilates in Pink — Events' },
  influencer: { email: 'partners@pilatesinpinkstudio.com', name: 'Pilates in Pink — Partnerships' },
};

const PUBLIC_BASE = 'https://apps.pilatesinpinkstudio.com/form';

function token() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { form_id, recipients } = await req.json();
    if (!form_id || !Array.isArray(recipients) || recipients.length === 0) {
      return Response.json({ error: 'form_id and recipients[] are required' }, { status: 400 });
    }

    const form = await base44.asServiceRole.entities.FormDefinition.get(form_id);
    if (!form) return Response.json({ error: 'Form not found' }, { status: 404 });

    const from = FROM_BY_APP[form.source_app] || FROM_BY_APP.support;
    const results = [];

    for (const r of recipients) {
      const email = (r.email || '').trim().toLowerCase();
      if (!email) continue;
      const name = (r.name || '').trim();
      const tok = token();

      // Persist the recipient with its unique token.
      const rec = await base44.asServiceRole.entities.FormRecipient.create({
        form_id,
        name,
        email,
        token: tok,
        sent_at: new Date().toISOString(),
        submitted: false,
      });

      const link = `${PUBLIC_BASE}?token=${tok}`;
      const greeting = name ? `Hi ${name.split(' ')[0]},` : 'Hi,';
      const body = `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#3a2030">
          <p>${greeting}</p>
          <p>You've been invited to fill out <strong>${form.name}</strong>.</p>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#7d2235;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">
              Open the form
            </a>
          </p>
          <p style="font-size:13px;color:#8a6b78">Or paste this link into your browser:<br>${link}</p>
          <p style="font-size:13px;color:#8a6b78">— Pilates in Pink Studio</p>
        </div>`;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          from_name: from.name,
          to: email,
          subject: `${form.name}`,
          body,
        });
        results.push({ email, recipient_id: rec.id, status: 'sent' });
      } catch (err) {
        results.push({ email, recipient_id: rec.id, status: 'failed', error: err.message });
      }
    }

    // Mark the form active once invites are out.
    await base44.asServiceRole.entities.FormDefinition.update(form_id, { status: 'active' });

    return Response.json({ ok: true, sent: results.filter((x) => x.status === 'sent').length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});