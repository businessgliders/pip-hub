import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Sparkles, ImagePlus, Plus, Loader2, X, ChevronDown, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FormFieldRow from "./FormFieldRow";
import FormPreview from "./FormPreview";

// Build / edit a form: name it, describe in natural language (or upload an image),
// generate fields with AI, tweak the preview, then Save draft / Save & Send.
export default function FormBuilder({ sourceApp, accent, existing, onBack, onSaved, onSaveAndSend }) {
  const [name, setName] = useState(existing?.name || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [fields, setFields] = useState(existing?.fields || []);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const progressTimer = useRef(null);
  // Collapse the Form Name + Describe area once fields exist, to give the
  // field editor more height. User can expand it again.
  const [setupCollapsed, setSetupCollapsed] = useState(false);

  // Animate a fake progress bar while generating (the LLM call takes time).
  useEffect(() => {
    if (generating) {
      setProgress(8);
      progressTimer.current = setInterval(() => {
        setProgress((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.06) : p));
      }, 250);
    } else {
      clearInterval(progressTimer.current);
    }
    return () => clearInterval(progressTimer.current);
  }, [generating]);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch {
      setError("Image upload failed.");
    }
    setUploading(false);
  };

  const generate = async () => {
    if (!description.trim() && !imageUrl) {
      setError("Describe the form or upload an image first.");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generateForm", { description, image_url: imageUrl });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);
      if (!name.trim() && data.title) setName(data.title);
      setFields(data.fields || []);
      setProgress(100);
      setSetupCollapsed(true);
    } catch (err) {
      setError(err.message || "Generation failed. Try again.");
    }
    setGenerating(false);
  };

  const updateField = (id, next) => setFields((fs) => fs.map((f) => (f.id === id ? next : f)));
  const removeField = (id) => setFields((fs) => fs.filter((f) => f.id !== id));
  const addField = () =>
    setFields((fs) => [...fs, { id: `f${fs.length}_${Math.random().toString(36).slice(2, 8)}`, label: "", type: "text", required: false, options: [] }]);

  const buildPayload = (status) => ({
    source_app: sourceApp,
    name: name.trim() || "Untitled form",
    description,
    fields,
    status,
  });

  const saveDraft = async () => {
    setSaving(true);
    try {
      const saved = existing?.id
        ? await base44.entities.FormDefinition.update(existing.id, buildPayload(existing.status || "draft"))
        : await base44.entities.FormDefinition.create(buildPayload("draft"));
      onSaved?.(saved);
    } finally {
      setSaving(false);
    }
  };

  const saveAndSend = async () => {
    setSaving(true);
    try {
      const saved = existing?.id
        ? await base44.entities.FormDefinition.update(existing.id, buildPayload(existing.status || "draft"))
        : await base44.entities.FormDefinition.create(buildPayload("draft"));
      onSaveAndSend?.(saved);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/50 dark:border-white/10 shrink-0">
        <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" style={{ color: accent }} />
        </button>
        <span className="font-bold text-pink-900 dark:text-white">{existing ? "Edit form" : "New form"}</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left column: editor + footer actions */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden lg:border-r lg:border-white/40 lg:dark:border-white/10">
        <div className="flex-1 min-w-0 overflow-y-auto ios-scroll p-4 space-y-4">
        {/* Name + describe — collapsible once fields exist */}
        {fields.length > 0 && setupCollapsed ? (
          <button
            onClick={() => setSetupCollapsed(false)}
            className="w-full flex items-center justify-between gap-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 px-3 py-2 text-left hover:bg-white/70 dark:hover:bg-white/10 transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-pink-900/50 dark:text-white/50">Form name</span>
              <span className="block text-sm font-semibold text-pink-900 dark:text-white truncate">{name.trim() || "Untitled form"}</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-pink-900/50 dark:text-white/50" />
          </button>
        ) : (
        <>
        {/* Name */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-pink-900/70 dark:text-white/70">Form name</label>
            {fields.length > 0 && (
              <button
                onClick={() => setSetupCollapsed(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-pink-900/50 dark:text-white/50 hover:text-pink-900 dark:hover:text-white"
              >
                <ChevronDown className="w-3.5 h-3.5" /> Collapse
              </button>
            )}
          </div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Event RSVP" className="mt-1 bg-white/70 dark:bg-white/5" />
        </div>

        {/* Describe / image */}
        <div className="rounded-2xl bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 p-3 space-y-3">
          <label className="text-xs font-semibold text-pink-900/70 dark:text-white/70 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} /> Describe your form
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="In plain language, describe what this form should collect — e.g. 'RSVP form with full name, email, number of guests, dietary restrictions, and preferred class.'"
            className="h-24 bg-white/70 dark:bg-white/5"
          />

          {imageUrl && (
            <div className="relative inline-block">
              <img src={imageUrl} alt="reference" className="h-20 rounded-lg border border-white/60" />
              <button onClick={() => setImageUrl("")} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImage} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-1.5 bg-white/60 dark:bg-white/5"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              Upload image
            </Button>
            <Button
              size="sm"
              onClick={generate}
              disabled={generating}
              className="gap-1.5 text-white"
              style={{ backgroundColor: accent }}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </Button>
          </div>

          {generating && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: accent }} />
              </div>
              <p className="text-[11px] text-pink-900/50 dark:text-white/50">Building your form… this can take a moment.</p>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        </>
        )}

        {/* Field editor */}
        {fields.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-pink-900/70 dark:text-white/70">Form fields ({fields.length})</span>
              <Button variant="ghost" size="sm" onClick={addField} className="gap-1 text-xs h-7" style={{ color: accent }}>
                <Plus className="w-3.5 h-3.5" /> Add field
              </Button>
            </div>
            {fields.map((f) => (
              <FormFieldRow key={f.id} field={f} accent={accent} onChange={(next) => updateField(f.id, next)} onRemove={() => removeField(f.id)} />
            ))}
          </div>
        )}
        </div>

        {/* Footer actions — under the left column only */}
        <div className="flex items-center gap-2 p-3 border-t border-white/40 dark:border-white/10 shrink-0">
          <Button variant="outline" onClick={saveDraft} disabled={saving || !fields.length} className="flex-1 bg-white/60 dark:bg-white/5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save draft"}
          </Button>
          <Button onClick={saveAndSend} disabled={saving || !fields.length} className="flex-1 text-white" style={{ backgroundColor: accent }}>
            Save & Send
          </Button>
        </div>
        </div>

        {/* Right column: live preview — full height */}
        <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] shrink-0 flex-col overflow-y-auto ios-scroll p-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <span className="text-xs font-semibold text-pink-900/70 dark:text-white/70 mb-2.5">Live preview</span>
          <FormPreview name={name} fields={fields} accent={accent} />
        </div>
      </div>
    </div>
  );
}