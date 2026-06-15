import React from "react";
import { VIEW_THEME } from "./inboxConfig";

const GMAIL_ICON = "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg";
const ZOOM_ICON = "https://media.base44.com/images/public/690aaf0c732696417648d224/adb1bdaaa_image.png";

// Quick-action icons (Gmail search + Zoom phone call) shown beside the resolve
// button in the Mail panel header — mirrors the spoke app's request detail panel.
export default function ThreadContactActions({ thread, view }) {
  const accent = (VIEW_THEME[view] || VIEW_THEME.events).accent;
  const email = thread?.contact_email;
  const phone = thread?.form_data?.phone || thread?.form_data?.Phone;

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
          style={btnStyle}
          className="p-1.5 rounded-full hover:brightness-95 transition-all flex items-center justify-center"
        >
          <img src={GMAIL_ICON} alt="Gmail" className="w-4 h-4" />
        </a>
      )}
      {phone && (
        <a
          href={`zoomphonecall://${phone.replace(/[^\d+]/g, "")}`}
          title="Call on Zoom"
          style={btnStyle}
          className="p-1.5 rounded-full hover:brightness-95 transition-all flex items-center justify-center"
        >
          <img src={ZOOM_ICON} alt="Zoom" className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}