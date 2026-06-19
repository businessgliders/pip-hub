// Tiny CSV helpers for the Forms recipient flow — no external deps.

// Parse a CSV string into recipient objects. Recognizes "name" and "email"
// columns (case-insensitive). If there's no header, assumes [name, email] or
// a single email column.
export function parseRecipientsCsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => r.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));

  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.toLowerCase());
  const hasHeader = header.some((h) => h.includes("email") || h.includes("name"));
  let emailIdx = header.findIndex((h) => h.includes("email"));
  let nameIdx = header.findIndex((h) => h.includes("name"));
  const body = hasHeader ? rows.slice(1) : rows;

  if (!hasHeader) {
    // Guess: a cell containing "@" is the email.
    emailIdx = rows[0].findIndex((c) => c.includes("@"));
    nameIdx = emailIdx === 0 ? 1 : 0;
  }

  const out = [];
  const seen = new Set();
  for (const cells of body) {
    const email = (emailIdx >= 0 ? cells[emailIdx] : cells.find((c) => c.includes("@")) || "").toLowerCase();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    out.push({ name: nameIdx >= 0 ? cells[nameIdx] || "" : "", email });
  }
  return out;
}

// Build a CSV string from submissions for export. Columns = field labels.
export function submissionsToCsv(form, submissions) {
  const fields = form.fields || [];
  const headers = ["Name", "Email", "Submitted", ...fields.map((f) => f.label)];
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const s of submissions) {
    const a = s.answers || {};
    const row = [
      s.recipient_name || "",
      s.recipient_email || "",
      s.submitted_date ? new Date(s.submitted_date).toLocaleString() : "",
      ...fields.map((f) => {
        const v = a[f.id] ?? a[f.label];
        return Array.isArray(v) ? v.join("; ") : v;
      }),
    ];
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}