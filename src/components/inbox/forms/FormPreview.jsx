import React from "react";

// A live, read-only render of the form as recipients will see it.
// Mirrors the fields array in real-time as the editor changes.
export default function FormPreview({ name, fields = [], accent }) {
  return (
    <div className="relative rounded-2xl bg-white/80 dark:bg-zinc-900/70 border border-white/60 dark:border-white/10 shadow-sm p-5 space-y-4 opacity-80 grayscale">
      {/* Diagonal PREVIEW watermark — keeps focus on the editor side */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
        <span
          className="select-none font-extrabold tracking-[0.3em] text-5xl rotate-[-24deg] whitespace-nowrap"
          style={{ color: accent, opacity: 0.07 }}
        >
          PREVIEW
        </span>
      </div>

      <h3 className="text-lg font-bold text-pink-900 dark:text-white">
        {name?.trim() || "Untitled form"}
      </h3>

      {fields.length === 0 ? (
        <p className="text-sm text-pink-900/40 dark:text-white/40">
          Your form preview will appear here.
        </p>
      ) : (
        <div className="space-y-3.5">
          {fields.map((f) => (
            <FieldPreview key={f.id} field={f} accent={accent} />
          ))}

          <button
            type="button"
            disabled
            className="w-full mt-2 py-2.5 rounded-xl text-white text-sm font-semibold opacity-90 cursor-default"
            style={{ backgroundColor: accent }}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

function FieldPreview({ field, accent }) {
  const { label, type, required, options = [] } = field;
  const labelEl = (
    <label className="block text-xs font-semibold text-pink-900/70 dark:text-white/70 mb-1">
      {label || "Untitled field"} {required && <span className="text-red-500">*</span>}
    </label>
  );
  const inputClass =
    "w-full rounded-lg border border-pink-200/70 dark:border-white/15 bg-white/90 dark:bg-white/5 px-3 py-2 text-sm text-pink-900/80 dark:text-white/70 pointer-events-none";

  if (type === "textarea") {
    return (
      <div>
        {labelEl}
        <div className={`${inputClass} h-16`} />
      </div>
    );
  }

  if (type === "select") {
    return (
      <div>
        {labelEl}
        <select
          defaultValue=""
          className="w-full rounded-lg border border-pink-200/70 dark:border-white/15 bg-white/90 dark:bg-white/5 px-3 py-2 text-sm text-pink-900/80 dark:text-white/70 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": accent }}
        >
          <option value="" disabled>Choose…</option>
          {options.map((o, i) => (
            <option key={i} value={o}>{o}</option>
          ))}
        </select>
      </div>
    );
  }

  if (type === "checkbox") {
    const opts = options.length ? options : ["Option"];
    return (
      <div>
        {labelEl}
        <div className="space-y-1.5">
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-pink-900/70 dark:text-white/60">
              <span className="w-4 h-4 rounded border border-pink-300/70 dark:border-white/20 inline-block" />
              {o}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const placeholder =
    type === "email" ? "name@email.com"
    : type === "phone" ? "(555) 555-5555"
    : type === "number" ? "0"
    : type === "date" ? "MM/DD/YYYY"
    : type === "time" ? "--:--"
    : "Your answer";

  return (
    <div>
      {labelEl}
      <div className={inputClass}>
        <span className="text-pink-900/40 dark:text-white/30">{placeholder}</span>
      </div>
    </div>
  );
}