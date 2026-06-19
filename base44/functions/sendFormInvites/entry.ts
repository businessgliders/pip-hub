import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Per-inbox shared From address — MUST match the spoke auto-reply senders so
// recipients see the same "Events @ Pilates in Pink ™" identity. Each address
// must be a verified send-as alias on the connected Gmail account.
const FROM_BY_SOURCE = {
  support: { name: 'Support @ Pilates in Pink ™', email: 'support@pilatesinpinkstudio.com' },
  events: { name: 'Events @ Pilates in Pink ™', email: 'events@pilatesinpinkstudio.com' },
  influencer: { name: 'Influencer @ Pilates in Pink ™', email: 'influencer@pilatesinpinkstudio.com' },
};

// Public form-fill page is hosted on the PUBLIC pip-events app (events.pilatesinpinkstudio.com),
// so recipients are never bounced to a login page. The page there calls this
// hub's getPublicForm / submitPublicForm functions to load & save responses.
const PUBLIC_BASE = 'https://events.pilatesinpinkstudio.com/form';

function token() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str || '');
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/(.{1,76})/g, '$1\r\n').trim();
}

function encodeHeader(str) {
  const s = str || '';
  if (/^[\x00-\x7F]*$/.test(s)) return s;
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(s)))}?=`;
}

function base64url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function stripHtml(html) {
  return (html || '')
    .replace(/<\/?(p|div|br|h[1-6]|li|a)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildMime({ to, from, subject, htmlBody, textBody }) {
  const altBoundary = `alt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    '',
    `--${altBoundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    utf8ToBase64(textBody),
    `--${altBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    utf8ToBase64(htmlBody),
    `--${altBoundary}--`,
  ];
  return lines.join('\r\n');
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

    const from = FROM_BY_SOURCE[form.source_app] || FROM_BY_SOURCE.support;
    const fromHeader = `${encodeHeader(from.name)} <${from.email}>`;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    const results = [];

    for (const r of recipients) {
      const email = (r.email || '').trim().toLowerCase();
      if (!email) continue;
      const name = (r.name || '').trim();
      const tok = token();

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
      const htmlBody = `
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
      const textBody = `${greeting}\n\nYou've been invited to fill out ${form.name}.\n\nOpen the form: ${link}\n\n— Pilates in Pink Studio`;

      try {
        const mime = buildMime({ to: email, from: fromHeader, subject: form.name, htmlBody, textBody });
        const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: base64url(mime) }),
        });
        if (!res.ok) {
          const text = await res.text();
          results.push({ email, recipient_id: rec.id, status: 'failed', error: text });
        } else {
          results.push({ email, recipient_id: rec.id, status: 'sent' });
        }
      } catch (err) {
        results.push({ email, recipient_id: rec.id, status: 'failed', error: err.message });
      }
    }

    await base44.asServiceRole.entities.FormDefinition.update(form_id, { status: 'active' });

    return Response.json({ ok: true, sent: results.filter((x) => x.status === 'sent').length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});