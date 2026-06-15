import React from "react";
import { Calendar, Sparkles, Tag, FileText, AlertTriangle } from "lucide-react";

// Fields that carry photo/social-media consent (boolean or yes/no string).
const CONSENT_KEYS = ["consent_to_photos", "photo_consent", "consent_photos_social", "consent", "media_consent"];

function isYes(v) {
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1" || s === "agreed" || s === "consented";
}

function asArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function Field({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-pink-400 font-semibold">{label}</div>
      <div className="text-lg font-semibold text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-pink-400">
      <Icon className="w-4 h-4" />
      <span className="text-xs uppercase tracking-widest font-bold">{children}</span>
    </div>
  );
}

// A pill for an add-on item; consent pills are colored by yes/no.
function Pill({ children, tone = "neutral", icon: Icon }) {
  const tones = {
    neutral: "bg-pink-50 text-pink-600 border-pink-100",
    included: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    no: "bg-amber-50 text-amber-700 border-amber-300",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${tones[tone]}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </span>
  );
}

export default function EventSubmissionDetails({ formData }) {
  const fd = formData || {};
  const eventDate = fd.event_date;
  const guests = fd.guest_count ?? fd.number_of_guests;
  const timeSlot = fd.time_slot || fd.preferred_times;
  const duration = fd.duration;
  const classes = asArray(fd.selected_classes);
  const addOns = asArray(fd.add_ons);
  const budget = fd.budget;
  const notes = fd.notes || fd.message;

  // Consent value (search known keys)
  const consentKey = CONSENT_KEYS.find((k) => fd[k] !== undefined && fd[k] !== null && fd[k] !== "");
  const hasConsent = consentKey !== undefined;
  const consentYes = hasConsent && isYes(fd[consentKey]);

  return (
    <div className="p-6 space-y-7">
      {/* Event details */}
      <section className="space-y-4">
        <SectionTitle icon={Calendar}>Event Details</SectionTitle>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Event Date" value={eventDate ? new Date(eventDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null} />
          <Field label="Guests" value={guests != null ? `${guests} guests` : null} />
          <Field label="Time Slot" value={timeSlot} />
          <Field label="Duration" value={duration} />
        </div>
      </section>

      {/* Classes */}
      {classes.length > 0 && (
        <section className="space-y-3">
          <SectionTitle icon={Sparkles}>Classes</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {classes.map((c, i) => <Pill key={i} tone="neutral">{c}</Pill>)}
          </div>
        </section>
      )}

      {/* Add-ons + consent */}
      {(addOns.length > 0 || hasConsent) && (
        <section className="space-y-3">
          <SectionTitle icon={Tag}>Add-Ons</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {hasConsent && (
              <Pill tone={consentYes ? "yes" : "no"} icon={consentYes ? undefined : AlertTriangle}>
                Consent to Photos &amp; Social Media{consentYes ? "" : " — Not Granted"}
              </Pill>
            )}
            {addOns.map((a, i) => (
              <Pill key={i} tone="included">
                {a} <span className="text-[10px] font-bold tracking-wide text-emerald-600/70">INCL</span>
              </Pill>
            ))}
          </div>
        </section>
      )}

      {/* Budget & notes */}
      {(budget || notes) && (
        <section className="space-y-3">
          <SectionTitle icon={FileText}>Budget &amp; Notes</SectionTitle>
          {budget && (
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <span className="text-pink-300">$</span>
              {String(budget).replace(/^\$/, "")}
            </div>
          )}
          {notes && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{notes}</p>}
        </section>
      )}
    </div>
  );
}