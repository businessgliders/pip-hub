import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// --- Helpers -------------------------------------------------------------

const decodeBase64Url = (data) => {
  if (!data) return '';
  try {
    const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
};

const headerVal = (headers, name) => {
  const h = headers?.find((x) => x.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
};

// Parse "Name <email@x.com>" or just "email@x.com"
const parseAddress = (raw) => {
  if (!raw) return { name: '', email: '' };
  const m = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: '', email: raw.trim().toLowerCase() };
};

const parseAddressList = (raw) => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => parseAddress(s).email)
    .filter(Boolean);
};

// Walk the MIME tree and pull the first text/plain and text/html parts
const extractBodies = (payload) => {
  let text = '';
  let html = '';
  const walk = (part) => {
    if (!part) return;
    const mime = part.mimeType || '';
    const data = part.body?.data;
    if (data) {
      if (mime === 'text/plain' && !text) text = decodeBase64Url(data);
      else if (mime === 'text/html' && !html) html = decodeBase64Url(data);
    }
    (part.parts || []).forEach(walk);
  };
  walk(payload);
  // Fallback: if no multipart, the top-level body may carry data directly
  if (!text && !html && payload?.body?.data) {
    const top = decodeBase64Url(payload.body.data);
    if ((payload.mimeType || '').includes('html')) html = top;
    else text = top;
  }
  return { text, html };
};

// Find the first matching route for the recipient list
const pickRoute = (recipients, routes) => {
  const active = routes
    .filter((r) => r.is_active !== false)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

  for (const route of active) {
    const target = (route.recipient || '').toLowerCase().trim();
    if (!target) continue;

    // Wildcard domain match: "*@domain.com"
    if (target.startsWith('*@')) {
      const domain = target.slice(2);
      const hit = recipients.find((r) => r.endsWith('@' + domain));
      if (hit) return { route, matched: hit };
      continue;
    }

    // Exact match
    const hit = recipients.find((r) => r === target);
    if (hit) return { route, matched: hit };
  }
  return null;
};

// --- Handler -------------------------------------------------------------

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This endpoint is invoked by the Base44 platform's Gmail connector dispatcher,
    // which authenticates the call — no custom secret/auth check is needed (and adding
    // one would break platform invocation). We only guard against malformed/empty
    // bodies so forged or junk requests fail closed instead of throwing.
    const body = await req.json().catch(() => null);
    const messageIds = body?.data?.new_message_ids ?? [];
    if (messageIds.length === 0) {
      return Response.json({ ok: true, processed: 0, reason: 'no new messages' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Load routing table once
    const routes = await base44.asServiceRole.entities.EmailRoute.list();

    const results = [];

    for (const messageId of messageIds) {
      try {
        // Dedupe: skip if we've already stored this Gmail message
        const existing = await base44.asServiceRole.entities.IncomingEmail.filter({
          gmail_message_id: messageId,
        });
        if (existing.length > 0) {
          results.push({ messageId, status: 'skipped_duplicate' });
          continue;
        }

        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
          { headers: authHeader }
        );
        if (!res.ok) {
          results.push({ messageId, status: 'fetch_failed', code: res.status });
          continue;
        }
        const message = await res.json();

        const headers = message.payload?.headers || [];
        const fromHeader = headerVal(headers, 'From');
        const from = parseAddress(fromHeader);
        const toList = parseAddressList(headerVal(headers, 'To'));
        const ccList = parseAddressList(headerVal(headers, 'Cc'));
        const deliveredTo = parseAddressList(headerVal(headers, 'Delivered-To'));
        const subject = headerVal(headers, 'Subject');

        // Recipients to evaluate for routing
        const recipientPool = Array.from(
          new Set([...toList, ...ccList, ...deliveredTo].filter(Boolean))
        );

        const match = pickRoute(recipientPool, routes);
        const spokeKey = match?.route?.spoke_key || 'unrouted';
        const matchedRecipient = match?.matched || (recipientPool[0] || '');

        const { text, html } = extractBodies(message.payload);

        const receivedAt = message.internalDate
          ? new Date(Number(message.internalDate)).toISOString()
          : new Date().toISOString();

        await base44.asServiceRole.entities.IncomingEmail.create({
          gmail_message_id: messageId,
          gmail_thread_id: message.threadId || '',
          spoke_key: spokeKey,
          matched_recipient: matchedRecipient,
          from_email: from.email,
          from_name: from.name,
          to: toList,
          cc: ccList,
          subject,
          snippet: message.snippet || '',
          body_text: text,
          body_html: html,
          received_at: receivedAt,
          label_ids: message.labelIds || [],
          status: 'new',
        });

        results.push({ messageId, status: 'stored', spokeKey, matchedRecipient });
      } catch (err) {
        console.error('Error processing message', messageId, err);
        results.push({ messageId, status: 'error', error: err.message });
      }
    }

    return Response.json({ ok: true, processed: results.length, results });
  } catch (error) {
    console.error('gmailInboxWebhook error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});