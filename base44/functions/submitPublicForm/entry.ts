import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// CORS — called cross-origin from the public spoke apps where the form pages
// are hosted: events.pilatesinpinkstudio.com, support.pilatesinpinkstudio.com,
// and partner.pilatesinpinkstudio.com.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Public: submit a filled-out form by recipient token. No auth required — the
// token validates the submitter. Records a FormSubmission and marks the
// recipient as submitted.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  try {
    const base44 = createClientFromRequest(req);
    const { token, answers } = await req.json();
    if (!token) return Response.json({ error: 'Missing token' }, { status: 400, headers: CORS });
    if (!answers || typeof answers !== 'object') {
      return Response.json({ error: 'answers object required' }, { status: 400, headers: CORS });
    }

    const recs = await base44.asServiceRole.entities.FormRecipient.filter({ token });
    const rec = recs?.[0];
    if (!rec) return Response.json({ error: 'invalid_token' }, { status: 404, headers: CORS });
    if (rec.submitted) return Response.json({ error: 'already_submitted' }, { status: 409, headers: CORS });

    await base44.asServiceRole.entities.FormSubmission.create({
      form_id: rec.form_id,
      recipient_id: rec.id,
      recipient_name: rec.name || '',
      recipient_email: rec.email || '',
      answers,
      submitted_date: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.FormRecipient.update(rec.id, { submitted: true });

    return Response.json({ ok: true }, { headers: CORS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});