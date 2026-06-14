import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const REPO = "businessgliders/pip-events";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = Deno.env.get("GITHUB_TOKEN");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "base44-repo-explorer",
    };

    const { action, path, filter, branch, start, end } = await req.json();
    const ref = branch || "main";

    if (action === "tree") {
      const r = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${ref}?recursive=1`, { headers });
      const j = await r.json();
      if (!j.tree) return Response.json({ error: j.message || "no tree", status: r.status }, { status: 502 });
      let paths = j.tree.filter((t) => t.type === "blob").map((t) => t.path);
      if (filter) {
        const re = new RegExp(filter, "i");
        paths = paths.filter((p) => re.test(p));
      }
      return Response.json({ paths });
    }

    if (action === "file") {
      const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${ref}`, { headers });
      const j = await r.json();
      if (!j.content) return Response.json({ error: j.message || "no content", status: r.status }, { status: 502 });
      const full = atob(j.content.replace(/\n/g, ""));
      const slice = (start != null || end != null) ? full.slice(start || 0, end || undefined) : full;
      return Response.json({ path, content: slice, length: full.length });
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});