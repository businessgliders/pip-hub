import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public: fetch a form definition by a recipient token. No auth required —
// the token itself is the access credential. Returns only what the filler needs.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const recs = await base44.asServiceRole.entities.FormRecipient.filter({ token });
    const rec = recs?.[0];
    if (!rec) return Response.json({ error: 'invalid_token' }, { status: 404 });

    const form = await base44.asServiceRole.entities.FormDefinition.get(rec.form_id);
    if (!form) return Response.json({ error: 'form_not_found' }, { status: 404 });

    return Response.json({
      ok: true,
      already_submitted: !!rec.submitted,
      recipient: { name: rec.name || '', email: rec.email || '' },
      form: {
        id: form.id,
        name: form.name,
        source_app: form.source_app,
        fields: form.fields || [],
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});