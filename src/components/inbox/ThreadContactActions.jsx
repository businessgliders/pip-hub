import React from "react";
import { Video } from "lucide-react";
import { VIEW_THEME } from "./inboxConfig";

// Gmail "M" envelope logo rendered in a single brown tone (monochrome).
function GmailLogo({ className, color = "#6b4423" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color} aria-hidden="true">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4H4l8 6 8-6h.5A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5H18V9.4l-6 4.5-6-4.5V20H3.5A1.5 1.5 0 0 1 2 18.5v-13Z" />
    </svg>
  );
}

// Finds the first phone-like value in the submission data, regardless of the
// exact field name used by each spoke form (phone, Phone, phone_number, etc.).
function findPhone(formData = {}) {
  for (const [k, v] of Object.entries(formData)) {
    if (!v || typeof v === "object") continue;
    if (/phone|mobile|cell|tel/i.test(k)) {
      const raw = String(v);
      if (/\d/.test(raw)) return raw;
    }
  }
  return "";
}

// Normalizes a phone string into a Zoom-dialable format: digits only, with a
// leading "+" preserved. Defaults to North American "+1" when no country code.
function normalizePhone(raw = "") {
  let digits = String(raw).replace(/[^\d+]/g, "");
  const hasPlus = digits.startsWith("+");
  digits = digits.replace(/\+/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

// Quick-action icons (Gmail search + Zoom phone call) shown beside the resolve
// button in the Mail panel header — mirrors the spoke app's request detail panel.
export default function ThreadContactActions({ thread, view }) {
  const accent = (VIEW_THEME[view] || VIEW_THEME.events).accent;
  const email = thread?.contact_email;
  const phone = normalizePhone(findPhone(thread?.form_data));

  if (!email && !phone) return null;

  const btnStyle = { backgroundColor: `${accent}22` };

  return (
    <div className="flex items-center gap-1.5">
      {email && (
        <a
          href={`https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Search all in Gmail"
          style={{ backgroundColor: "#6b442322" }}
          className="p-1.5 rounded-full hover:brightness-95 transition-all flex items-center justify-center"
        >
          <GmailLogo className="w-4 h-4" color="#6b4423" />
        </a>
      )}
      {phone && (
        <a
          href={`zoomphonecall://${phone}`}
          title="Call on Zoom"
          style={btnStyle}
          className="p-1.5 rounded-full hover:brightness-95 transition-all flex items-center justify-center"
        >
          <Video className="w-4 h-4" style={{ color: accent }} />
        </a>
      )}
    </div>
  );
}