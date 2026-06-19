import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, Loader2, ChevronRight, Send, BarChart3 } from "lucide-react";
import { SOURCE_META } from "@/components/inbox/inboxConfig";
import FormBuilder from "./FormBuilder";
import RecipientsModal from "./RecipientsModal";
import SubmissionsPanel from "./SubmissionsPanel";

// In-place Forms workspace for a single inbox: list forms, build/edit with AI,
// send invites to recipients, and view submissions with CSV export.
export default function FormsPanel({ sourceApp, accent }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState("list"); // list | build | submissions
  const [editing, setEditing] = useState(null);
  const [sendForm, setSendForm] = useState(null); // form being sent (modal)
  const [viewForm, setViewForm] = useState(null); // form whose submissions are shown

  const { data: forms, isLoading } = useQuery({
    queryKey: ["forms", sourceApp],
    queryFn: () => base44.entities.FormDefinition.filter({ source_app: sourceApp }, "-created_date", 200),
    initialData: [],
  });

  const inboxLabel = SOURCE_META[sourceApp]?.label || sourceApp;

  const openNew = () => { setEditing(null); setMode("build"); };
  const openEdit = (f) => { setEditing(f); setMode("build"); };
  const openSubmissions = (f) => { setViewForm(f); setMode("submissions"); };
  const afterSave = (saved) => {
    qc.invalidateQueries({ queryKey: ["forms", sourceApp] });
    setMode("list");
    setEditing(null);
    return saved;
  };

  if (mode === "build") {
    return (
      <FormBuilder
        sourceApp={sourceApp}
        accent={accent}
        existing={editing}
        onBack={() => { setMode("list"); setEditing(null); }}
        onSaved={afterSave}
        onSaveAndSend={async (saved) => { afterSave(saved); setSendForm(saved); }}
      />
    );
  }

  if (mode === "submissions" && viewForm) {
    return <SubmissionsPanel form={viewForm} accent={accent} onBack={() => { setMode("list"); setViewForm(null); }} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/50 dark:border-white/10 shrink-0">
        <div>
          <h2 className="font-bold text-pink-900 dark:text-white leading-tight">{inboxLabel} Forms</h2>
          <p className="text-[11px] text-pink-900/50 dark:text-white/50">{forms.length} form{forms.length === 1 ? "" : "s"}</p>
        </div>
        <button
          onClick={openNew}
          title="New form"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto ios-scroll p-3 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-pink-900/40" /></div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-14 px-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${accent}1a`, color: accent }}>
              <FileText className="w-6 h-6" />
            </div>
            <p className="font-semibold text-pink-900 dark:text-white">No forms yet</p>
            <p className="text-xs text-pink-900/50 dark:text-white/50 mt-1">Tap + to build your first {inboxLabel.toLowerCase()} form with AI.</p>
          </div>
        ) : (
          forms.map((f) => (
            <div
              key={f.id}
              className="w-full rounded-2xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3 hover:bg-white/80 dark:hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <button onClick={() => openEdit(f)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}1a`, color: accent }}>
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-pink-900 dark:text-white truncate">{f.name}</div>
                  <div className="text-[11px] text-pink-900/50 dark:text-white/50">
                    {(f.fields || []).length} field{(f.fields || []).length === 1 ? "" : "s"} · {f.status === "active" ? "Sent" : "Draft"}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-1 shrink-0">
                {f.status === "active" && (
                  <button
                    onClick={() => openSubmissions(f)}
                    title="View submissions"
                    className="rounded-lg text-pink-900/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 p-2 md:px-3 md:py-1.5 md:text-xs md:font-semibold md:flex md:items-center md:gap-1.5"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden md:inline">View Submission</span>
                  </button>
                )}
                <button
                  onClick={() => setSendForm(f)}
                  disabled={!(f.fields || []).length}
                  title={f.status === "active" ? "Resend to recipients" : "Send to recipients"}
                  className="rounded-lg text-white disabled:opacity-40 p-2 md:px-3 md:py-1.5 md:text-xs md:font-semibold md:flex md:items-center md:gap-1.5"
                  style={{ backgroundColor: accent }}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden md:inline">{f.status === "active" ? "Resend" : "Send"}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {sendForm && (
        <RecipientsModal
          form={sendForm}
          accent={accent}
          open={!!sendForm}
          onOpenChange={(o) => { if (!o) setSendForm(null); }}
          onSent={() => qc.invalidateQueries({ queryKey: ["forms", sourceApp] })}
        />
      )}
    </div>
  );
}