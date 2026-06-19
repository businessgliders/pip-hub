import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Loader2, Send, Users, RotateCw, Check, Link2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseRecipientsCsv } from "./csvUtils";

const PUBLIC_BASE = "https://events.pilatesinpinkstudio.com/form";

// Collect recipients (manual rows + CSV upload) and send personalized invites
// with unique form links via the sendFormInvites backend function.
// When the form was already sent, previously-invited recipients are listed
// with a per-recipient re-send action.
export default function RecipientsModal({ form, accent, open, onOpenChange, onSent }) {
  const [rows, setRows] = useState([{ name: "", email: "" }]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const alreadySent = form?.status === "active";
  const [sentRecipients, setSentRecipients] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [resentIds, setResentIds] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const copyLink = (rec) => {
    if (!rec.token) return;
    navigator.clipboard.writeText(`${PUBLIC_BASE}?token=${rec.token}`);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId((id) => (id === rec.id ? null : id)), 1500);
  };

  // Load previously-invited recipients for a sent form.
  useEffect(() => {
    if (!open || !alreadySent || !form?.id) return;
    setLoadingSent(true);
    base44.entities.FormRecipient.filter({ form_id: form.id }, "-sent_at", 500)
      .then((recs) => {
        // De-dupe by email — keep the most recent row per recipient so each
        // person shows once regardless of how many times they were re-sent.
        const map = new Map();
        (recs || []).forEach((r) => {
          const key = (r.email || "").toLowerCase();
          if (key && !map.has(key)) map.set(key, r);
        });
        setSentRecipients(Array.from(map.values()));
      })
      .finally(() => setLoadingSent(false));
  }, [open, alreadySent, form?.id]);

  const setRow = (i, key, val) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  const addRow = () => setRows((rs) => [...rs, { name: "", email: "" }]);
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const handleCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseRecipientsCsv(text);
    if (parsed.length === 0) { setError("No valid emails found in that CSV."); return; }
    setError("");
    const existing = rows.filter((r) => r.email.trim());
    const map = new Map();
    [...existing, ...parsed].forEach((r) => map.set(r.email.toLowerCase(), { name: r.name || "", email: r.email }));
    setRows(Array.from(map.values()));
    if (fileRef.current) fileRef.current.value = "";
  };

  const valid = rows.filter((r) => r.email.trim().includes("@"));

  const send = async () => {
    if (valid.length === 0) { setError("Add at least one recipient email."); return; }
    setError("");
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendFormInvites", {
        form_id: form.id,
        recipients: valid.map((r) => ({ name: r.name.trim(), email: r.email.trim().toLowerCase() })),
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      setResult(data);
      onSent?.(data);
    } catch (err) {
      setError(err.message || "Failed to send invites.");
    }
    setSending(false);
  };

  // Re-send the invite to a single previously-invited recipient.
  const resendOne = async (rec) => {
    setResendingId(rec.id);
    setError("");
    try {
      const res = await base44.functions.invoke("sendFormInvites", {
        form_id: form.id,
        recipients: [{ name: rec.name || "", email: rec.email }],
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      setResentIds((ids) => [...ids, rec.id]);
      onSent?.(data);
    } catch (err) {
      setError(err.message || "Failed to re-send.");
    }
    setResendingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: accent }} />
            {alreadySent ? `Re-send "${form?.name}"` : `Send "${form?.name}"`}
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <Send className="w-5 h-5" />
            </div>
            <p className="font-semibold text-pink-900 dark:text-white">{result.sent} form{result.sent === 1 ? "" : "s"} sent!</p>
            <p className="text-sm text-muted-foreground">Each recipient got a unique link to fill out the form.</p>
            <Button onClick={() => onOpenChange(false)} className="mt-2 text-white" style={{ backgroundColor: accent }}>Done</Button>
          </div>
        ) : (
          <>
            {/* Previously-sent recipients with per-recipient re-send */}
            {alreadySent && (
              <div className="rounded-xl bg-black/[0.03] dark:bg-white/5 border border-white/60 dark:border-white/10 p-2.5">
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                  Already sent ({sentRecipients.length})
                </div>
                {loadingSent ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                ) : sentRecipients.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-1 pb-1">No previous recipients.</p>
                ) : (
                  <div className="max-h-44 overflow-y-auto ios-scroll space-y-1 pr-1">
                    {sentRecipients.map((rec) => (
                      <div key={rec.id} className="flex items-center gap-2 px-1.5 py-1 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-pink-900 dark:text-white truncate">{rec.name || rec.email}</div>
                          {rec.name && <div className="text-[11px] text-muted-foreground truncate">{rec.email}</div>}
                        </div>
                        <button
                          onClick={() => copyLink(rec)}
                          disabled={!rec.token}
                          title="Copy form link"
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
                        >
                          {copiedId === rec.id ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                        </button>
                        {resentIds.includes(rec.id) ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 pr-1.5">
                            <Check className="w-3.5 h-3.5" /> Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => resendOne(rec)}
                            disabled={resendingId === rec.id}
                            title="Re-send to this recipient"
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                            style={{ color: accent }}
                          >
                            {resendingId === rec.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {alreadySent ? "Add new recipients" : `${valid.length} recipient${valid.length === 1 ? "" : "s"}`}
              </span>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleCsv} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5">
                  <Upload className="w-4 h-4" /> Upload CSV
                </Button>
                <Button variant="ghost" size="sm" onClick={addRow} className="gap-1" style={{ color: accent }}>
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto ios-scroll space-y-2 pr-1">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input placeholder="Name" value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} className="flex-1" />
                  <Input placeholder="email@example.com" value={r.email} onChange={(e) => setRow(i, "email", e.target.value)} className="flex-[1.4]" />
                  <button onClick={() => removeRow(i)} className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">CSV should have <strong>name</strong> and <strong>email</strong> columns.</p>
            {error && <p className="text-xs text-red-500">{error}</p>}

            <Button onClick={send} disabled={sending || valid.length === 0} className="w-full text-white gap-2" style={{ backgroundColor: accent }}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send {valid.length > 0 ? valid.length : ""} form{valid.length === 1 ? "" : "s"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}