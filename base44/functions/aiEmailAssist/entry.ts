import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STAFF_DOMAIN = 'pilatesinpinkstudio.com';

const STYLE_GUIDE = `Tone: warm, friendly, professional. Pilates in Pink is a boutique pink-themed Pilates studio offering classes, private events, bridal showers, bachelorette parties, corporate wellness experiences, and influencer/brand partnerships.
- Keep replies concise (2-4 short paragraphs max).
- Address the client by their first name when known.
- Sign off as the staff member writing (signature added separately — do NOT include a sign-off block).
- Never invent facts about pricing, schedules, or terms — defer to confirming details if unsure.
- Use plain HTML with <p> tags only. No headers, no inline styles.`;

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatFormData(formData) {
  const entries = Object.entries(formData || {}).filter(
    ([k, v]) => k !== 'source_app' && v !== null && v !== undefined && v !== ''
  );
  return entries
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
}

async function buildThreadContext(base44, thread) {
  const messages = await base44.asServiceRole.entities.EmailMessage.filter({ ticket_id: thread.id }, 'sent_at', 200);
  const lines = [];
  lines.push(`=== INQUIRY (${thread.source_app} · Ticket #${thread.ticket_number || thread.id.slice(-8)}) ===`);
  lines.push(`Client: ${thread.contact_name || ''} <${thread.contact_email}>`);
  lines.push(`Subject: ${thread.subject || '-'}`);
  lines.push(`Status: ${thread.status || '-'}`);
  const fd = formatFormData(thread.form_data);
  if (fd) {
    lines.push('');
    lines.push('--- Form submission ---');
    lines.push(fd);
  }
  lines.push('');
  lines.push('=== EMAIL THREAD ===');
  for (const m of messages) {
    const who = m.direction === 'inbound' ? `Client (${m.from_name || m.from_email})` : `Staff (${m.sent_by || 'team'})`;
    lines.push(`--- ${who} · ${m.sent_at || ''} ---`);
    lines.push(`Subject: ${m.subject || ''}`);
    lines.push(stripHtml(m.body_html || m.body_text || '').slice(0, 1500));
    lines.push('');
  }
  return { context: lines.join('\n'), messageCount: messages.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && !String(user.email || '').toLowerCase().endsWith(`@${STAFF_DOMAIN}`)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { mode, thread_id, description, draft, force_refresh } = await req.json();
    if (!mode || !thread_id) return Response.json({ error: 'Missing mode or thread_id' }, { status: 400 });

    const thread = await base44.asServiceRole.entities.Thread.get(thread_id);
    if (!thread) return Response.json({ error: 'Thread not found' }, { status: 404 });

    const { context, messageCount } = await buildThreadContext(base44, thread);

    if (mode === 'suggest') {
      if (
        !force_refresh &&
        Array.isArray(thread.ai_suggestions) &&
        thread.ai_suggestions.length > 0 &&
        thread.ai_suggestions_message_count === messageCount
      ) {
        return Response.json({
          suggestions: thread.ai_suggestions,
          cached: true,
          generated_at: thread.ai_suggestions_generated_at,
        });
      }

      const prompt = `${STYLE_GUIDE}\n\n${context}\n\n=== TASK ===\nGenerate EXACTLY 3 distinct reply suggestions for the staff to send to this client. Each must take a different angle:\n1. Direct/Quick — short, decisive answer\n2. Detailed/Thorough — covers more context and next steps\n3. Warm/Relationship — friendly, builds rapport\nReturn JSON: { "suggestions": [ { "label": "...", "body_html": "<p>...</p>" } ] } with <p> tags only.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  body_html: { type: 'string' },
                },
                required: ['label', 'body_html'],
              },
            },
          },
          required: ['suggestions'],
        },
      });

      const suggestions = result?.suggestions || [];
      const generatedAt = new Date().toISOString();

      await base44.asServiceRole.entities.Thread.update(thread_id, {
        ai_suggestions: suggestions,
        ai_suggestions_generated_at: generatedAt,
        ai_suggestions_message_count: messageCount,
      });

      return Response.json({ suggestions, cached: false, generated_at: generatedAt });
    }

    if (mode === 'summarize') {
      if (thread.submission_summary && !force_refresh) {
        return Response.json({ summary: thread.submission_summary, cached: true });
      }
      const fd = formatFormData(thread.form_data);
      if (!fd) return Response.json({ summary: '' });
      const isCancellation = String(thread.form_data?.inquiry_type || thread.subject || '').toLowerCase().includes('cancel');
      const cancelHint = isCancellation
        ? `\n\nThis is a CANCELLATION request. In your sentence, mention the reason for cancelling, the discount/special offer presented (if any), and whether the client accepted it or chose to continue with the cancellation.`
        : '';
      const prompt = `${STYLE_GUIDE}\n\nA client submitted the following ${thread.source_app} inquiry form:\n\n${fd}${cancelHint}\n\n=== TASK ===\nWrite a single concise sentence (max ${isCancellation ? 32 : 22} words) summarizing what this person is asking for / wants. Plain text, no labels, no quotes. Return JSON: { "summary": "..." }`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: 'object', properties: { summary: { type: 'string' } }, required: ['summary'] },
      });
      const summary = (result?.summary || '').trim();
      await base44.asServiceRole.entities.Thread.update(thread_id, { submission_summary: summary });
      return Response.json({ summary, cached: false });
    }

    if (mode === 'compose') {
      if (!description) return Response.json({ error: 'description required for compose' }, { status: 400 });
      const prompt = `${STYLE_GUIDE}\n\n${context}\n\n=== TASK ===\nThe staff member wants to convey this in their reply: "${description}"\n\nWrite the full email body in HTML (<p> tags only, no sign-off block). Return JSON: { "body_html": "..." }`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: 'object', properties: { body_html: { type: 'string' } }, required: ['body_html'] },
      });
      return Response.json({ body_html: result?.body_html || '' });
    }

    if (mode === 'polish') {
      if (!draft) return Response.json({ error: 'draft required for polish' }, { status: 400 });
      const prompt = `${STYLE_GUIDE}\n\n${context}\n\n=== TASK ===\nPolish the following draft for grammar, tone, and flow while preserving the staff member's intent and key facts. Do not add or invent new information.\n\nDRAFT:\n${draft}\n\nReturn JSON: { "body_html": "..." } with <p> tags only.`;
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: { type: 'object', properties: { body_html: { type: 'string' } }, required: ['body_html'] },
      });
      return Response.json({ body_html: result?.body_html || '' });
    }

    return Response.json({ error: 'unknown mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});