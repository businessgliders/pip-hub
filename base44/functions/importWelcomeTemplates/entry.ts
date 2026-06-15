import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Pulls each spoke repo's canonical welcomeEmailHtml.jsx, extracts the raw HTML
// template literal, normalizes its ${...} interpolations into {{handlebars}}
// placeholders, and upserts one clean welcome EmailTemplate per source.
const REPOS = [
  {
    repo: 'pip-support',
    source_app: 'support',
    name: 'Support — Auto-Reply (Submitter)',
    subject: "👋 [Ticket {{ticket_id}}] {{inquiry_type}} - {{client_name}}",
  },
  {
    repo: 'pip-events',
    source_app: 'events',
    name: 'Events — Auto-Reply (Submitter)',
    subject: "🎉 [Request {{ticket_id}}] {{event_type}} Event Request - {{client_name}}",
  },
  {
    repo: 'pip-partner',
    source_app: 'influencer',
    name: 'Influencer — Auto-Reply (Submitter)',
    subject: "[Application {{ticket_id}}] We've Received Your Influencer Application",
  },
];

const VAR_MAP = {
  clientName: '{{client_name}}',
  inquiryType: '{{inquiry_type}}',
  eventType: '{{event_type}}',
  ticketShortId: '{{ticket_id}}',
  appNumber: '{{ticket_id}}',
};

async function ghFile(repo, path, token) {
  const res = await fetch(
    `https://api.github.com/repos/businessgliders/${repo}/contents/${path}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'base44' } }
  );
  const j = await res.json();
  if (!j.content) throw new Error(`Could not read ${repo}/${path}: ${j.message || res.status}`);
  return atob(j.content.replace(/\n/g, ''));
}

// Pull the first big HTML template literal (the one containing <!DOCTYPE or <body>)
function extractHtml(src) {
  const ticks = [];
  const re = /`([\s\S]*?)`/g;
  let m;
  while ((m = re.exec(src))) ticks.push(m[1]);
  // Pick the largest literal that looks like an email body
  const candidates = ticks
    .filter((t) => /<body|<!DOCTYPE|<table|<div/i.test(t))
    .sort((a, b) => b.length - a.length);
  return candidates[0] || null;
}

function normalize(html) {
  let out = html;
  for (const [key, ph] of Object.entries(VAR_MAP)) {
    out = out.replaceAll('${' + key + '}', ph);
    out = out.replaceAll('${' + key + " || 'there'}", ph);
    out = out.replaceAll('${' + key + ' || "there"}', ph);
  }
  // Strip any remaining ${...} interpolations that reference per-ticket data
  out = out.replace(/\$\{[^}]*\}/g, '');
  return out.trim();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = Deno.env.get('GITHUB_TOKEN');
    const results = [];

    for (const cfg of REPOS) {
      const src = await ghFile(cfg.repo, 'src/components/email/welcomeEmailHtml.jsx', token);
      const rawHtml = extractHtml(src);
      if (!rawHtml) { results.push({ source: cfg.source_app, status: 'no_html_found' }); continue; }
      const body_html = normalize(rawHtml);

      const data = {
        name: cfg.name,
        category: 'Auto-Reply',
        source_app: cfg.source_app,
        template_kind: 'welcome',
        subject: cfg.subject,
        body_html,
        is_active: true,
        is_default: false,
      };

      // Upsert by (source_app, template_kind=welcome)
      const existing = await base44.asServiceRole.entities.EmailTemplate.filter({
        source_app: cfg.source_app,
        template_kind: 'welcome',
      });
      if (existing.length) {
        await base44.asServiceRole.entities.EmailTemplate.update(existing[0].id, data);
        results.push({ source: cfg.source_app, action: 'updated', id: existing[0].id, html_len: body_html.length });
      } else {
        const created = await base44.asServiceRole.entities.EmailTemplate.create(data);
        results.push({ source: cfg.source_app, action: 'created', id: created.id, html_len: body_html.length });
      }
    }

    return Response.json({ ok: true, results });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});