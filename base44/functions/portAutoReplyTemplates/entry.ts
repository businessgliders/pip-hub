import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * portAutoReplyTemplates — admin one-time port.
 * Reads the most recent welcome (submitter) auto-reply and owner notification
 * email per source app from imported EmailMessages, replaces the dynamic values
 * with {{variables}}, and upserts them as EmailTemplate records so they're
 * editable + reusable inside the hub.
 */
const SOURCES = ['support', 'events', 'influencer'];
const LABEL = { support: 'Support', events: 'Events', influencer: 'Influencer' };

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replace concrete contact/ticket values in a sent email with template variables.
function tokenize(html, thread) {
  if (!html) return html;
  let out = html;
  const fd = thread.form_data || {};
  const replacements = [
    [thread.contact_name, '{{client_name}}'],
    [thread.contact_email, '{{client_email}}'],
    [fd.phone, '{{client_phone}}'],
    [fd.event_type, '{{event_type}}'],
    [fd.event_date, '{{event_date}}'],
    [fd.inquiry_type, '{{inquiry_type}}'],
  ];
  for (const [val, token] of replacements) {
    if (val && String(val).trim().length > 2) {
      out = out.replace(new RegExp(escapeRe(String(val)), 'g'), token);
    }
  }
  // First name (after full name replaced, also catch standalone first name)
  const first = (thread.contact_name || '').split(' ')[0];
  if (first && first.length > 2) {
    out = out.replace(new RegExp(`\\b${escapeRe(first)}\\b`, 'g'), '{{client_first_name}}');
  }
  // Ticket number -> {{ticket_id}}
  if (thread.ticket_number) {
    out = out.replace(new RegExp(`#\\s*${escapeRe(String(thread.ticket_number))}`, 'g'), '{{ticket_id}}');
  }
  return out;
}

function tokenizeSubject(subject, thread) {
  let out = tokenize(subject, thread);
  return out;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const db = base44.asServiceRole.entities;
    const existing = await db.EmailTemplate.list('-created_date', 200);
    const saved = [];

    for (const src of SOURCES) {
      const threads = await db.Thread.filter({ source_app: src }, '-last_activity_at', 200);
      const idSet = new Set(threads.map((t) => t.id));
      const srcIdSet = new Set(threads.map((t) => t.source_ticket_id).filter(Boolean));
      const threadByTicket = {};
      for (const t of threads) {
        threadByTicket[t.id] = t;
        if (t.source_ticket_id) threadByTicket[t.source_ticket_id] = t;
      }

      const recent = await db.EmailMessage.filter({}, '-sent_at', 800);
      const forSrc = recent.filter((m) => idSet.has(m.ticket_id) || srcIdSet.has(m.ticket_id));

      // Prefer a sample tied to a real submitter (full name >= 4 chars) so we
      // don't capture junk/test tickets like "dd".
      const cleanName = (m) => {
        const t = threadByTicket[m.ticket_id];
        return t && (t.contact_name || '').trim().length >= 4;
      };
      const welcomes = forSrc.filter((m) => m.is_welcome && (m.body_html || '').length > 200);
      const welcome = welcomes.find(cleanName) || welcomes[0];
      const owners = forSrc.filter(
        (m) =>
          m.direction === 'outbound' &&
          !m.is_welcome &&
          /pilatesinpinkstudio\.com$/i.test(m.to_email || '') &&
          (m.body_html || '').length > 200
      );
      const owner = owners.find(cleanName) || owners[0];

      for (const [kind, msg] of [['welcome', welcome], ['owner', owner]]) {
        if (!msg) continue;
        const thread = threadByTicket[msg.ticket_id] || {};
        const name = `${LABEL[src]} — ${kind === 'welcome' ? 'Auto-Reply (Submitter)' : 'Owner Notification'}`;
        const record = {
          name,
          category: 'Auto-Reply',
          source_app: src,
          template_kind: kind,
          subject: tokenizeSubject(msg.subject || '', thread),
          body_html: tokenize(msg.body_html || '', thread),
          is_active: true,
        };
        const prior = existing.find((t) => t.name === name);
        if (prior) {
          await db.EmailTemplate.update(prior.id, record);
        } else {
          await db.EmailTemplate.create(record);
        }
        saved.push({ name, kind, source: src, subject: record.subject });
      }
    }

    return Response.json({ success: true, count: saved.length, saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});