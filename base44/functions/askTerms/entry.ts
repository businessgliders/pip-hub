import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TERMS_URL = "https://pricing.pilatesinpinkstudio.com/terms";
const PRICING_URL = "https://pricing.pilatesinpinkstudio.com";

// In-memory cache (per warm instance). Refresh every 24h.
let cachedTerms = null;
let cachedAt = 0;
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

async function fetchTermsText() {
  const now = Date.now();
  if (cachedTerms && now - cachedAt < CACHE_TTL_MS) return cachedTerms;

  const [terms, pricing] = await Promise.all([
    fetchPage(TERMS_URL).catch(() => ""),
    fetchPage(PRICING_URL).catch(() => ""),
  ]);

  const combined =
    `=== TERMS & ETIQUETTE (from ${TERMS_URL}) ===\n${terms}\n\n` +
    `=== PRICING (from ${PRICING_URL}) ===\n${pricing}`;

  if (combined.length < 500) throw new Error(`Knowledge content too short (${combined.length} chars).`);

  cachedTerms = combined;
  cachedAt = now;
  return cachedTerms;
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