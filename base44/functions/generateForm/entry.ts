import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Generates a structured form schema from a natural-language description and/or
// an uploaded reference image, using an LLM. Admin-only.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { description = '', image_url = '' } = await req.json();
    if (!description.trim() && !image_url) {
      return Response.json({ error: 'Provide a description or an image' }, { status: 400 });
    }

    const prompt = `You are a form-building assistant. Based on the user's request${image_url ? ' and the attached reference image' : ''}, design a web form.

User request: "${description}"

Return a JSON object with:
- "title": a short form title
- "fields": an array of field objects, each with:
  - "label": human-readable question/label
  - "type": one of "text", "textarea", "email", "phone", "number", "date", "time", "select", "checkbox"
  - "required": boolean
  - "options": array of strings (ONLY for "select" or "checkbox" fields; omit otherwise)

Choose the most appropriate field type for each label (e.g. email -> "email", phone number -> "phone", a date -> "date", long answers -> "textarea", multiple choices -> "select"). Keep it concise and practical.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: image_url ? [image_url] : undefined,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                type: { type: 'string' },
                required: { type: 'boolean' },
                options: { type: 'array', items: { type: 'string' } },
              },
              required: ['label', 'type'],
            },
          },
        },
        required: ['title', 'fields'],
      },
    });

    // Normalize + attach stable ids.
    const allowed = ['text', 'textarea', 'email', 'phone', 'number', 'date', 'time', 'select', 'checkbox'];
    const fields = (result?.fields || []).map((f, i) => ({
      id: `f${i}_${Math.random().toString(36).slice(2, 8)}`,
      label: f.label || `Field ${i + 1}`,
      type: allowed.includes(f.type) ? f.type : 'text',
      required: !!f.required,
      options: Array.isArray(f.options) ? f.options : [],
    }));

    return Response.json({ title: result?.title || '', fields });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});