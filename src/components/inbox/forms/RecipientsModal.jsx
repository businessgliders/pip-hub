import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Loader2, Send, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseRecipientsCsv } from "./csvUtils";

// Collect recipients (manual rows + CSV upload) and send personalized invites
// with unique form links via the sendFormInvites backend function.
export default function RecipientsModal({ form, accent, open, onOpenChange, onSent }) {
  const [rows, setRows] = useState([{ name: "", email: "" }]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

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
    // Merge with existing non-empty rows, de-duped by email.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: accent }} />
            Send "{form?.name}"
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <Send className="w-5 h-5" />
            </div>
            <p className="font-semibold text-pink-900 dark:text-white">{result.sent} invite{result.sent === 1 ? "" : "s"} sent!</p>
            <p className="text-sm text-muted-foreground">Each recipient got a unique link to fill out the form.</p>
            <Button onClick={() => onOpenChange(false)} className="mt-2 text-white" style={{ backgroundColor: accent }}>Done</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{valid.length} recipient{valid.length === 1 ? "" : "s"}</span>
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
              Send {valid.length > 0 ? valid.length : ""} invite{valid.length === 1 ? "" : "s"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}