import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const token = Deno.env.get('GITHUB_TOKEN');
    const { repo, path } = await req.json();
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'base44',
    };

    if (path) {
      // Fetch a single file's raw content
      const res = await fetch(`https://api.github.com/repos/businessgliders/${repo}/contents/${path}`, { headers });
      const j = await res.json();
      if (j.content) {
        return Response.json({ status: res.status, content: atob(j.content.replace(/\n/g, '')) });
      }
      return Response.json({ status: res.status, body: j });
    }

    // List the repo tree (try main then master)
    let tree = [];
    for (const branch of ['main', 'master']) {
      const res = await fetch(`https://api.github.com/repos/businessgliders/${repo}/git/trees/${branch}?recursive=1`, { headers });
      const j = await res.json();
      if (Array.isArray(j.tree)) { tree = j.tree.map((t) => t.path); break; }
    }
    const relevant = tree.filter((p) => /welcome|email|intake|template|reply|notif|send/i.test(p));
    return Response.json({ repo, count: tree.length, relevant });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
});