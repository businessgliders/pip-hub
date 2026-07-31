import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Bold, Italic, List, Link as LinkIcon, Loader2, Save, X, Trash2 } from "lucide-react";

// Category to use for a template belonging to a given inbox.
const CATEGORY_BY_SOURCE = { support: "Support", events: "Events", influencer: "Influencer" };

function isEditorEmpty(html) {
  return !(html || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
}

// In-brand rich editor for creating / editing a single email template.
export default function TemplateEditor({ sourceApp, accent, template, onClose, onDeleted }) {
  const qc = useQueryClient();
  const editorRef = useRef(null);
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [saving, setSaving] = useState(false);
  const isNew = !template?.id;

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = template?.body_html || template?.body || "";
  }, [template]);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const handleLink = () => {
    const url = window.prompt("Enter URL");
    if (url) exec("createLink", url);
  };

  const handleSave = async () => {
    if (!name.trim() || !subject.trim()) {
      alert("Please add a template name and subject.");
      return;
    }
    const body_html = editorRef.current?.innerHTML || "";
    if (isEditorEmpty(body_html)) {
      alert("Please write the template body.");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      body_html,
      category: CATEGORY_BY_SOURCE[sourceApp] || "General",
      source_app: sourceApp,
      is_active: true,
    };
    try {
      if (isNew) await base44.entities.EmailTemplate.create(payload);
      else await base44.entities.EmailTemplate.update(template.id, payload);
      qc.invalidateQueries({ queryKey: ["emailTemplates"] });
      onClose();
    } catch (err) {
      alert("Failed to save: " + (err?.message || "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew || !window.confirm(`Delete template "${template.name}"?`)) return;
    setSaving(true);
    try {
      await base44.entities.EmailTemplate.delete(template.id);
      qc.invalidateQueries({ queryKey: ["emailTemplates"] });
      onDeleted?.();
      onClose();
    } catch (err) {
      alert("Failed to delete: " + (err?.message || "unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3 mb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-white/60">
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-bold" style={{ color: accent }}>
            {isNew ? "New Template" : "Edit Template"}
          </h3>
        </div>
        {!isNew && (
          <button onClick={handleDelete} disabled={saving} className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 disabled:opacity-50" title="Delete template">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto ios-scroll space-y-3 px-1">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 mb-1">Template name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Booking confirmation"
            className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-slate-800 dark:text-white focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": accent }}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-slate-800 dark:text-white focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": accent }}
          />
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 mb-1">Message</label>
          <div className="flex items-center gap-1 mb-1.5">
            <button onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10" title="Bold"><Bold className="w-3.5 h-3.5 text-slate-600 dark:text-white/70" /></button>
            <button onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10" title="Italic"><Italic className="w-3.5 h-3.5 text-slate-600 dark:text-white/70" /></button>
            <button onClick={() => exec("insertUnorderedList")} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10" title="Bullet list"><List className="w-3.5 h-3.5 text-slate-600 dark:text-white/70" /></button>
            <button onClick={handleLink} className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10" title="Insert link"><LinkIcon className="w-3.5 h-3.5 text-slate-600 dark:text-white/70" /></button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Write the template message…"
            className="prose prose-sm max-w-none focus:outline-none px-3 py-2 rounded-lg empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 dark:empty:before:text-white/40 bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 text-slate-800 dark:text-white"
            style={{ minHeight: 140, maxHeight: 300, overflowY: "auto", fontSize: "14px" }}
          />
          <p className="text-[11px] text-slate-400 dark:text-white/40 mt-1.5">
            Use variables like <code>{"{{client_first_name}}"}</code>, <code>{"{{staff_name}}"}</code>, <code>{"{{ticket_id}}"}</code>.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-black/5 dark:border-white/10 px-1">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 hover:brightness-95"
          style={{ backgroundColor: accent }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isNew ? "Create" : "Save"}
        </button>
      </div>
    </div>
  );
}