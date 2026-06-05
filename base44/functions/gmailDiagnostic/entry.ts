import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Admin-only diagnostic: fetches the latest few inbox messages directly via
// gmail.readonly so we can confirm the shared connector + scopes work.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const auth = { Authorization: `Bearer ${accessToken}` };

    // Who am I (which Google account is connected)?
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: auth });
    const profile = await profileRes.json();

    // List the 5 most recent inbox messages
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=in:inbox',
      { headers: auth }
    );
    const list = await listRes.json();

    const messages = [];
    for (const m of (list.messages || []).slice(0, 5)) {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Delivered-To&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: auth }
      );
      const msg = await r.json();
      const headers = {};
      (msg.payload?.headers || []).forEach(h => { headers[h.name] = h.value; });
      messages.push({
        id: msg.id,
        threadId: msg.threadId,
        internalDate: msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : null,
        snippet: msg.snippet,
        headers,
      });
    }

    return Response.json({
      profile,
      messagesFound: list.messages?.length || 0,
      messages,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});