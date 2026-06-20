import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// CORS — called cross-origin from the public spoke apps where the form pages
// are hosted: events.pilatesinpinkstudio.com, support.pilatesinpinkstudio.com,
// and partner.pilatesinpinkstudio.com.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Public: fetch a form definition by a recipient token. No auth required —
// the token itself is the access credential. Returns only what the filler needs.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400, headers: CORS });

    const recs = await base44.asServiceRole.entities.FormRecipient.filter({ token });
    const rec = recs?.[0];
    if (!rec) return Response.json({ error: 'invalid_token' }, { status: 404, headers: CORS });

    const form = await base44.asServiceRole.entities.FormDefinition.get(rec.form_id);
    if (!form) return Response.json({ error: 'form_not_found' }, { status: 404, headers: CORS });

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
    }, { headers: CORS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});