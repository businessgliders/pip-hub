import React from "react";
import EventSubmissionDetails from "./EventSubmissionDetails";

// Internal / system fields that should never be shown to staff in the submission modal.
const INTERNAL = new Set([
  "source_app", "spoke_ticket_id", "ticket_number", "status", "status_history",
  "priority", "archived", "assigned_to", "is_sample", "id", "created_date",
  "updated_date", "created_by_id", "created_by", "last_reminder_sent",
  "ai_suggestions", "ai_suggestions_generated_at", "ai_suggestions_message_count",
  // Contact identity is shown in the header, not the body.
  "name", "email", "phone", "client_name", "client_email", "client_phone",
  "subject", "inquiry_type", "source", "source_ticket_id", "gmail_thread_id",
]);

// Friendly labels for known client-facing fields.
const LABELS = {
  cancellation_reason: "Reason for Cancellation",
  cancellation_satisfaction: "Satisfaction Level",
  cancellation_feedback: "Additional Feedback",
  discount_offered: "Special Offer Presented",
  discount_accepted: "Client's Decision",
  message: "Message",
  comments: "Comments",
  notes: "Notes",
};

function prettyKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format a value for display, with special handling for known fields.
function formatValue(key, v) {
  if (key === "discount_offered") {
    return <span>🎁 {String(v)}</span>;
  }
  if (key === "discount_accepted") {
    return v
      ? "Accepted — client chose to stay"
      : "Declined — client chose to continue with cancellation";
  }
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

// Value is empty/meaningless and should be skipped.
function isEmpty(v) {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

export default function SubmissionDetails({ formData, sourceApp }) {
  // Events get a dedicated structured layout with classes/add-ons/consent pills.
  if (sourceApp === "events") {
    return <EventSubmissionDetails formData={formData} />;
  }

  const entries = Object.entries(formData || {}).filter(([k, v]) => {
    if (INTERNAL.has(k)) return false;
    if (typeof v === "object" && !Array.isArray(v)) return false; // skip nested objects
    // discount_accepted is a boolean we always want to show; others skip when empty.
    if (k !== "discount_accepted" && isEmpty(v)) return false;
    return true;
  });

  if (entries.length === 0) {
    return <p className="text-sm text-slate-400 p-6">No additional submission details.</p>;
  }

  return (
    <div className="p-6 space-y-5">
      {entries.map(([k, v]) => (
        <div key={k}>
          <div className="text-sm font-semibold text-slate-900">{LABELS[k] || prettyKey(k)}:</div>
          <div className="text-sm text-slate-600 mt-1 break-words">{formatValue(k, v)}</div>
        </div>
      ))}
    </div>
  );
}