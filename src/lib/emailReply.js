// Split an email HTML body into the freshly written reply and the quoted
// thread history that mail clients append below it.

const QUOTE_SELECTORS = [
  ".gmail_quote",
  ".gmail_extra",
  ".gmail_attr",
  "blockquote",
  "#divRplyFwdMsg",
  ".OutlookMessageHeader",
  "div.yahoo_quoted",
  ".yahoo_quoted",
  ".moz-cite-prefix",
  ".protonmail_quote",
  "#appendonsend",
  "div[id^='quoted-']",
];

const MARKER_RE = /^(On .{0,200}? wrote:|-{2,}\s*Original Message\s*-{2,}|-{2,}\s*Forwarded message\s*-{2,}|_{5,})/i;

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

// Harden links so rendered HTML opens externally and can't hijack the tab.
export function hardenLinks(root) {
  root.querySelectorAll("a").forEach((a) => {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
  root.querySelectorAll("script, iframe, object, embed").forEach((el) => el.remove());
}

// Count quoted messages by top-level quote containers / markers found.
export function splitEmailHtml(bodyHtml, bodyText) {
  const source = bodyHtml || (bodyText ? `<div>${escapeHtml(bodyText)}</div>` : "");
  if (!source || typeof DOMParser === "undefined") {
    return { replyHtml: source, quotedHtml: "", quotedCount: 0 };
  }

  const doc = new DOMParser().parseFromString(source, "text/html");
  const body = doc.body;
  hardenLinks(body);
  const fullHtml = body.innerHTML;

  const quoted = doc.createElement("div");
  let quotedCount = 0;

  // 1. Standard quote containers.
  body.querySelectorAll(QUOTE_SELECTORS.join(",")).forEach((el) => {
    if (!el.isConnected) return; // already moved as part of a parent quote
    quoted.appendChild(el);
    quotedCount++;
  });

  // 2. "On ... wrote:" / "----- Original Message -----" text markers: cut the
  //    marker's nearest block element and everything after it (same parent).
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let markerNode = null;
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent.trim();
    if (t && MARKER_RE.test(t)) { markerNode = walker.currentNode; break; }
  }
  if (markerNode) {
    let block = markerNode.parentElement;
    while (block && block.parentElement && block.parentElement !== body && !/^(DIV|P|TABLE|SECTION)$/.test(block.tagName)) {
      block = block.parentElement;
    }
    if (block && block !== body) {
      const trailing = [];
      let n = block;
      while (n) { trailing.push(n); n = n.nextSibling; }
      trailing.forEach((node) => quoted.appendChild(node));
      quotedCount++;
    }
  }

  const replyHtml = body.innerHTML;
  const meaningful = (body.textContent || "").replace(/\s+/g, " ").trim().length > 0 || body.querySelector("img");
  if (!meaningful) {
    return { replyHtml: fullHtml, quotedHtml: "", quotedCount: 0 };
  }
  return { replyHtml, quotedHtml: quoted.innerHTML, quotedCount };
}

function decodeEntities(text) {
  return (text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// Short plain-text preview of ONLY the new reply content for collapsed bubbles.
export function replyPreviewText(message, max = 200) {
  const { replyHtml } = splitEmailHtml(message.body_html, message.body_text);
  const plain = decodeEntities(
    (replyHtml || "")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|div|blockquote|br|li|tr)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}