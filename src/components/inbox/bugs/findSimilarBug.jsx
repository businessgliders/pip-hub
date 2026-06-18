import { base44 } from "@/api/base44Client";

// Search existing bug reports for one that describes the SAME underlying issue
// as the freshly-described bug. Returns the matched BugReport (or null).
// Only considers active reports (not Closed) so resolved/archived issues don't
// trigger a false "duplicate" prompt.
export async function findSimilarBug(description) {
  const text = String(description || "").trim();
  if (!text) return null;

  let candidates = [];
  try {
    candidates = await base44.entities.BugReport.list("-bug_number", 60);
  } catch {
    return null;
  }
  const active = candidates.filter((b) => (b.status || "New") !== "Closed");
  if (!active.length) return null;

  // Compact list for the model — id + number + title + description.
  const list = active.slice(0, 40).map((b) => ({
    id: b.id,
    bug_number: b.bug_number,
    title: b.title || "",
    description: (b.description || "").slice(0, 280),
  }));

  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt:
        `A staff member is reporting this new bug:\n"${text}"\n\n` +
        `Here is a list of existing bug reports (JSON):\n${JSON.stringify(list)}\n\n` +
        `Decide if the new bug describes the SAME underlying issue as one of the existing ones ` +
        `(i.e. a new instance/occurrence of the same bug — not just loosely related). ` +
        `If there is a confident match, return its id. Otherwise return null.`,
      response_json_schema: {
        type: "object",
        properties: {
          match_id: { type: ["string", "null"] },
          confidence: { type: "number" },
        },
      },
    });
    const id = res?.match_id;
    const confidence = res?.confidence ?? 0;
    if (!id || confidence < 0.6) return null;
    return active.find((b) => b.id === id) || null;
  } catch {
    return null;
  }
}