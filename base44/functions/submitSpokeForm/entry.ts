import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public intake endpoint for spoke app forms (Option A — hub owns the data).
// Spoke public forms POST here with a shared secret. No logged-in user required;
// we authenticate with SPOKE_INTAKE_SECRET and write via the service role.
//
// Expected JSON body:
// {
//   "secret": "<SPOKE_INTAKE_SECRET>",
//   "board": "support" | "events" | "partner",
//   "source_app": "pip-support",         // optional
//   "data": { ...fields matching the target entity... }
// }

const BOARD_TO_ENTITY = {
  support: 'SupportTicket',
  events: 'EventLead',
  partner: 'PartnerInquiry',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS_HEADERS });
    }

    const body = await req.json();
    const { secret, board, source_app, data } = body || {};

    const expectedSecret = Deno.env.get('SPOKE_INTAKE_SECRET');
    if (!secret || secret !== expectedSecret) {
      return Response.json({ error: 'Invalid secret' }, { status: 401, headers: CORS_HEADERS });
    }

    const entityName = BOARD_TO_ENTITY[board];
    if (!entityName) {
      return Response.json(
        { error: `Invalid board. Use one of: ${Object.keys(BOARD_TO_ENTITY).join(', ')}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!data || typeof data !== 'object') {
      return Response.json({ error: 'Missing data object' }, { status: 400, headers: CORS_HEADERS });
    }

    const base44 = createClientFromRequest(req);

    const record = {
      ...data,
      status: data.status || 'new',
      source_app: source_app || data.source_app || board,
    };

    const created = await base44.asServiceRole.entities[entityName].create(record);

    return Response.json({ success: true, id: created.id }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
});