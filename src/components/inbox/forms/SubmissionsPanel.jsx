import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Download, Loader2, CheckCircle2, Clock, Users, Inbox, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submissionsToCsv, downloadCsv } from "./csvUtils";

// View submissions + recipient delivery status for a sent form, with CSV export.
// The three top tiles (Sent / Completed / Pending) act as filters; Pending rows
// offer a "Remind" button that re-sends the invite with REMINDER: in the subject.
export default function SubmissionsPanel({ form, accent, onBack }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("sent"); // sent | completed | pending
  const [remindingId, setRemindingId] = useState(null);

  const { data: submissions, isLoading: loadingSubs } = useQuery({
    queryKey: ["form-submissions", form.id],
    queryFn: () => base44.entities.FormSubmission.filter({ form_id: form.id }, "-submitted_date", 500),
    initialData: [],
  });
  const { data: recipients } = useQuery({
    queryKey: ["form-recipients", form.id],
    queryFn: () => base44.entities.FormRecipient.filter({ form_id: form.id }, "-created_date", 500),
    initialData: [],
  });

  const submittedCount = recipients.filter((r) => r.submitted).length;
  const pendingRecipients = recipients.filter((r) => !r.submitted);
  const fields = form.fields || [];

  const exportCsv = () => {
    const csv = submissionsToCsv(form, submissions);
    downloadCsv(`${form.name.replace(/[^a-z0-9]+/gi, "_")}_submissions.csv`, csv);
  };

  const sendReminder = async (recipient) => {
    setRemindingId(recipient.id);
    try {
      const res = await base44.functions.invoke("sendFormInvites", {
        form_id: form.id,
        reminder: true,
        recipients: [{ recipient_id: recipient.id, email: recipient.email, name: recipient.name || "" }],
      });
      if (res?.data?.ok) {
        queryClient.invalidateQueries({ queryKey: ["form-recipients", form.id] });
      } else {
        alert("Failed to send reminder: " + (res?.data?.error || "unknown error"));
      }
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/50 dark:border-white/10 shrink-0">
        <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" style={{ color: accent }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-pink-900 dark:text-white truncate">{form.name}</div>
          <div className="text-[11px] text-pink-900/50 dark:text-white/50">Submissions</div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={submissions.length === 0} className="gap-1.5 bg-white/60 dark:bg-white/5">
          <Download className="w-4 h-4" /> CSV
        </Button>
      </div>

      {/* Stat chips — clickable filters */}
      <div className="flex gap-2 px-4 py-3 shrink-0">
        <Stat icon={Users} label="Sent" value={recipients.length} accent={accent} active={filter === "sent"} onClick={() => setFilter("sent")} />
        <Stat icon={CheckCircle2} label="Completed" value={submittedCount} accent={accent} active={filter === "completed"} onClick={() => setFilter("completed")} />
        <Stat icon={Clock} label="Pending" value={pendingRecipients.length} accent={accent} active={filter === "pending"} onClick={() => setFilter("pending")} />
      </div>

      <div className="flex-1 overflow-y-auto ios-scroll px-4 pb-4">
        {filter === "completed" ? (
          <CompletedList loading={loadingSubs} submissions={submissions} fields={fields} accent={accent} />
        ) : filter === "pending" ? (
          <PendingList recipients={pendingRecipients} accent={accent} remindingId={remindingId} onRemind={sendReminder} />
        ) : (
          <SentList recipients={recipients} accent={accent} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ accent, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${accent}1a`, color: accent }}>
        <Inbox className="w-6 h-6" />
      </div>
      <p className="font-semibold text-pink-900 dark:text-white">{title}</p>
      <p className="text-xs text-pink-900/50 dark:text-white/50 mt-1">{subtitle}</p>
    </div>
  );
}

function SentList({ recipients, accent }) {
  if (recipients.length === 0) return <EmptyState accent={accent} title="No recipients yet" subtitle="Recipients appear here once the form is sent." />;
  return (
    <div className="space-y-2.5">
      {recipients.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-pink-900 dark:text-white truncate">{r.name || r.email}</div>
            <div className="text-[11px] text-pink-900/50 dark:text-white/50 truncate">{r.email}</div>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${r.submitted ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
            {r.submitted ? "Completed" : "Pending"}
          </span>
        </div>
      ))}
    </div>
  );
}

function PendingList({ recipients, accent, remindingId, onRemind }) {
  if (recipients.length === 0) return <EmptyState accent={accent} title="Nothing pending" subtitle="Everyone who was invited has completed the form." />;
  return (
    <div className="space-y-2.5">
      {recipients.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-pink-900 dark:text-white truncate">{r.name || r.email}</div>
            <div className="text-[11px] text-pink-900/50 dark:text-white/50 truncate">{r.email}</div>
          </div>
          <Button
            size="sm"
            onClick={() => onRemind(r)}
            disabled={remindingId === r.id}
            className="gap-1.5 shrink-0 text-white"
            style={{ backgroundColor: accent }}
          >
            {remindingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Remind
          </Button>
        </div>
      ))}
    </div>
  );
}

function CompletedList({ loading, submissions, fields, accent }) {
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-pink-900/40" /></div>;
  if (submissions.length === 0) return <EmptyState accent={accent} title="No submissions yet" subtitle="Responses appear here as recipients complete the form." />;
  return (
    <div className="space-y-2.5">
      {submissions.map((s) => (
        <div key={s.id} className="rounded-2xl bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0">
              <div className="font-semibold text-pink-900 dark:text-white truncate">{s.recipient_name || s.recipient_email || "Anonymous"}</div>
              {s.recipient_email && <div className="text-[11px] text-pink-900/50 dark:text-white/50 truncate">{s.recipient_email}</div>}
            </div>
            <span className="text-[11px] text-pink-900/40 dark:text-white/40 shrink-0">
              {s.submitted_date ? new Date(s.submitted_date).toLocaleDateString() : ""}
            </span>
          </div>
          <div className="space-y-1">
            {fields.map((f) => {
              const v = (s.answers || {})[f.id] ?? (s.answers || {})[f.label];
              if (v == null || v === "") return null;
              return (
                <div key={f.id} className="text-xs flex gap-2">
                  <span className="text-pink-900/50 dark:text-white/50 shrink-0">{f.label}:</span>
                  <span className="text-pink-900 dark:text-white">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-2xl border p-2.5 flex flex-col items-center transition-all ${active ? "bg-white/90 dark:bg-white/10 shadow-sm" : "bg-white/60 dark:bg-white/5 border-white/60 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10"}`}
      style={active ? { borderColor: accent } : undefined}
    >
      <Icon className="w-4 h-4 mb-1" style={{ color: accent }} />
      <span className="text-lg font-bold text-pink-900 dark:text-white leading-none">{value}</span>
      <span className="text-[10px] text-pink-900/50 dark:text-white/50 mt-0.5">{label}</span>
    </button>
  );
}