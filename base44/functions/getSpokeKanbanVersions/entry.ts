import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Spokes to track. The Hub itself is the source of truth and is reported separately.
const SPOKES = [
  { key: "pip-events",  repo: "businessgliders/pip-events"  },
  { key: "pip-support", repo: "businessgliders/pip-support" },
  { key: "pip-partner", repo: "businessgliders/pip-partner" },
];

const HUB = { key: "pip-hub", repo: "businessgliders/pip-hub" };

const INDEX_PATH = "src/components/master-kanban/index.jsx";

// Parse out: export const MASTER_KANBAN_VERSION = "X.Y.Z";
function parseVersion(source) {
  if (!source) return null;
  const m = source.match(/MASTER_KANBAN_VERSION\s*=\s*["']([^"']+)["']/);
  return m ? m[1] : null;
}

async function fetchSpoke(repo, token) {
  // Use raw.githubusercontent.com (works for public; with a PAT in Authorization for private)
  const url = `https://raw.githubusercontent.com/${repo}/main/${INDEX_PATH}`;
  const headers = { "User-Agent": "pip-hub-version-tracker" };
  if (token) headers.Authorization = `token ${token}`;

  const res = await fetch(url, { headers });
  if (res.status === 404) {
    return { version: null, error: "Not found (file missing or repo private without token)", http_status: 404, source_url: url };
  }
  if (!res.ok) {
    return { version: null, error: `HTTP ${res.status}`, http_status: res.status, source_url: url };
  }
  const text = await res.text();
  const version = parseVersion(text);
  if (!version) {
    return { version: null, error: "Could not parse MASTER_KANBAN_VERSION from file", http_status: 200, source_url: url };
  }
  return { version, error: null, http_status: 200, source_url: url };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = Deno.env.get("GITHUB_TOKEN") || null;

    // Fire all 4 requests in parallel (3 spokes + hub for source-of-truth verification)
    const [hubResult, ...spokeResults] = await Promise.all([
      fetchSpoke(HUB.repo, token),
      ...SPOKES.map((s) => fetchSpoke(s.repo, token)),
    ]);

    const hubVersion = hubResult.version;

    const spokes = SPOKES.map((s, i) => {
      const r = spokeResults[i];
      let status = "unknown";
      if (r.version && hubVersion) {
        if (r.version === hubVersion) status = "up_to_date";
        else status = "behind"; // could also be "ahead" — treat any mismatch as drift
      } else if (r.error) {
        status = "error";
      }
      return {
        key: s.key,
        repo: s.repo,
        version: r.version,
        status,
        error: r.error,
        http_status: r.http_status,
        source_url: r.source_url,
      };
    });

    return Response.json({
      hub: {
        key: HUB.key,
        repo: HUB.repo,
        version: hubVersion,
        error: hubResult.error,
        source_url: hubResult.source_url,
      },
      spokes,
      checked_at: new Date().toISOString(),
      token_configured: !!token,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});