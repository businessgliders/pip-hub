import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TERMS_URL = "https://pricing.pilatesinpinkstudio.com/terms";
const PRICING_URL = "https://pricing.pilatesinpinkstudio.com";

// In-memory cache (per warm instance). Refresh every 24h.
// Terms and pricing are cached SEPARATELY so a transient failure on one page
// never poisons the other for the rest of the cache window.
const cache = {
  terms: { text: "", at: 0 },
  pricing: { text: "", at: 0 },
};
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchPage(url) {
  // Use Jina Reader to get JS-rendered markdown of the (client-side rendered) page.
  const readerUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(readerUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PilatesInPinkBot/1.0)", Accept: "text/plain" },
  });
  if (!res.ok) throw new Error(`Failed to fetch page ${url}: ${res.status}`);
  return (await res.text()).trim();
}

// Fetch a page with its own cache slot. Only caches a successful, non-empty
// result — a failed fetch falls back to any previously cached text.
async function getCached(key, url) {
  const slot = cache[key];
  const now = Date.now();
  if (slot.text && now - slot.at < CACHE_TTL_MS) return slot.text;
  try {
    const text = await fetchPage(url);
    if (text && text.length > 100) {
      slot.text = text;
      slot.at = now;
    }
  } catch (_) { /* keep stale text if present */ }
  return slot.text;
}

async function fetchTermsText() {
  const [terms, pricing] = await Promise.all([
    getCached("terms", TERMS_URL),
    getCached("pricing", PRICING_URL),
  ]);

  const combined =
    `=== TERMS & ETIQUETTE (from ${TERMS_URL}) ===\n${terms}\n\n` +
    `=== PRICING (from ${PRICING_URL}) ===\n${pricing}`;

  if (combined.length < 500) throw new Error(`Knowledge content too short (${combined.length} chars).`);

  return combined;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, history } = await req.json();
    if (!question || typeof question !== "string") {
      return Response.json({ error: "Missing 'question'" }, { status: 400 });
    }

    const termsText = await fetchTermsText();

    const prompt = `You are a knowledgeable, friendly assistant helping front-desk staff at "Pilates in Pink" studio quickly find and explain studio policies AND pricing.

Your ONLY source of truth is the following Terms & Etiquette and Pricing content (fetched live from ${TERMS_URL} and ${PRICING_URL}):

=== KNOWLEDGE CONTENT START ===
${termsText}
=== KNOWLEDGE CONTENT END ===

RULES:
- Base your answer STRICTLY on the content above (covers both policies and pricing).
- Quote the exact relevant phrasing using a markdown blockquote when possible.
- Be concise and direct — front desk staff need quick answers while clients are waiting.
- If the answer isn't covered, say plainly: "That isn't covered in our Terms or Pricing pages."
- Do NOT make up policies or prices. Do NOT reference anything outside the content above.
- Format with markdown: bold key terms, bullet lists where appropriate, blockquotes for citations.

Recent conversation:
${history || "(none)"}

Front-desk staff is asking: "${question}"

Answer their question now, citing the relevant section of the terms.`;

    const answer = await base44.integrations.Core.InvokeLLM({ prompt });

    return Response.json({
      answer: typeof answer === "string" ? answer : (answer?.response || answer?.text || ""),
      terms_length: termsText.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});