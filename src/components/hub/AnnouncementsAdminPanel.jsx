import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Trash2, Loader2, Sparkles, ChevronUp, ChevronDown, ExternalLink, Edit3, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import ConfirmationModal from './ConfirmationModal';

// Owner-only admin panel for managing announcement banners.
// Generates the banner image from an AI prompt and lets the owner
// edit hyperlinks, toggle visibility, and reorder slides.
export default function AnnouncementsAdminPanel({ onClose }) {
  useBodyScrollLock(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // New banner draft
  const [draft, setDraft] = useState({ title: '', subtitle: '', link_url: '', ai_prompt: '' });
  const [draftImage, setDraftImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Per-item regeneration state
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Announcement.list('order');
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Use an LLM to enrich a short user prompt into a detailed, cinematic
  // image-generation prompt — the same way the assistant writes prompts.
  const enrichPrompt = async (rawPrompt, { title, subtitle }) => {
    const context = [
      title ? `Banner title: "${title}"` : '',
      subtitle ? `Subtitle: "${subtitle}"` : '',
    ].filter(Boolean).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert AI image prompt engineer for a Pilates studio called "Pilates in Pink".
Brand vibe: bright, airy, feminine, modern, soft pinks (#f1889b, #f7b1bd, #fbe0e2), wellness, calm, cinematic.

${context}

User's short idea: "${rawPrompt}"

Rewrite this into a single, vivid, detailed image-generation prompt for a WIDE HORIZONTAL BANNER (16:9).
Include: subject, composition, lighting, mood, color palette, style, and texture.
Constraints: photorealistic OR elegant editorial illustration (pick what fits), cinematic, vibrant yet soft, high quality.
IMPORTANT: leave the bottom-left area visually clean/uncluttered for overlay text. No text, no watermarks, no logos in the image.
Return ONLY the final prompt as plain text — no preamble, no quotes.`,
      response_json_schema: {
        type: 'object',
        properties: { prompt: { type: 'string' } },
        required: ['prompt'],
      },
    });
    return result?.prompt?.trim() || rawPrompt;
  };

  const handleGenerateImage = async () => {
    if (!draft.ai_prompt.trim()) return;
    setIsGenerating(true);
    try {
      const enriched = await enrichPrompt(draft.ai_prompt.trim(), {
        title: draft.title,
        subtitle: draft.subtitle,
      });
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: enriched });
      setDraftImage(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!draft.title.trim() || !draftImage) return;
    setIsSaving(true);
    try {
      const maxOrder = items.reduce((m, i) => Math.max(m, i.order || 0), 0);
      await base44.entities.Announcement.create({
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        link_url: draft.link_url.trim(),
        ai_prompt: draft.ai_prompt.trim(),
        image_url: draftImage,
        is_active: true,
        order: maxOrder + 1,
      });
      setDraft({ title: '', subtitle: '', link_url: '', ai_prompt: '' });
      setDraftImage(null);
      await load();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (item) => {
    await base44.entities.Announcement.update(item.id, { is_active: !item.is_active });
    await load();
  };

  const handleDelete = async (item) => {
    await base44.entities.Announcement.delete(item.id);
    await load();
  };

  const handleMove = async (item, dir) => {
    const sorted = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await Promise.all([
      base44.entities.Announcement.update(item.id, { order: other.order || 0 }),
      base44.entities.Announcement.update(other.id, { order: item.order || 0 }),
    ]);
    await load();
  };

  const handleRegenerate = async (item) => {
    const prompt = item.ai_prompt || item.title;
    setRegeneratingId(item.id);
    try {
      const enriched = await enrichPrompt(prompt, {
        title: item.title,
        subtitle: item.subtitle,
      });
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: enriched });
      await base44.entities.Announcement.update(item.id, { image_url: url });
      await load();
    } finally {
      setRegeneratingId(null);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditDraft({
      title: item.title || '',
      subtitle: item.subtitle || '',
      link_url: item.link_url || '',
      ai_prompt: item.ai_prompt || '',
    });
  };

  const saveEdit = async (item) => {
    await base44.entities.Announcement.update(item.id, {
      title: editDraft.title.trim(),
      subtitle: editDraft.subtitle.trim(),
      link_url: editDraft.link_url.trim(),
      ai_prompt: editDraft.ai_prompt.trim(),
    });
    setEditingId(null);
    await load();
  };

  const sorted = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/20 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-4xl rounded-3xl backdrop-blur-xl bg-white/95 border border-white/60 shadow-2xl p-4 md:p-8 max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Announcement Banners</h2>
            <p className="text-sm text-gray-500 mt-1">Create AI-generated banners shown in the widget slider.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* New banner */}
        <div className="rounded-2xl border border-[#f1889b]/30 bg-[#f1889b]/5 p-4 md:p-5 mb-6">
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#f1889b]" /> Create new banner
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-gray-700 text-sm">Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Spring Promo — 20% off"
                  className="mt-1 bg-white border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700 text-sm">Subtitle (optional)</Label>
                <Input
                  value={draft.subtitle}
                  onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                  placeholder="e.g. Book your class today"
                  className="mt-1 bg-white border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700 text-sm">Link URL (optional)</Label>
                <Input
                  type="url"
                  value={draft.link_url}
                  onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1 bg-white border-gray-200"
                />
              </div>
              <div>
                <Label className="text-gray-700 text-sm">AI image prompt</Label>
                <Textarea
                  value={draft.ai_prompt}
                  onChange={(e) => setDraft({ ...draft, ai_prompt: e.target.value })}
                  placeholder="e.g. A bright, airy pilates studio with pink lighting, soft morning sun, minimalist vibe"
                  className="mt-1 bg-white border-gray-200 h-20"
                />
                <Button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !draft.ai_prompt.trim()}
                  className="mt-2 w-full bg-gradient-to-r from-[#f1889b] to-[#f7b1bd] text-white"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {isGenerating ? 'Generating image…' : draftImage ? 'Regenerate image' : 'Generate image'}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-gray-700 text-sm">Preview</Label>
              <div className="mt-1 aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
                {draftImage ? (
                  <>
                    <img src={draftImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />
                    {draft.title && (
                      <div className="absolute left-3 right-3 bottom-3 text-white drop-shadow">
                        <h4 className="font-semibold leading-tight line-clamp-2">{draft.title}</h4>
                        {draft.subtitle && <p className="text-xs opacity-90 mt-0.5 line-clamp-1">{draft.subtitle}</p>}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm text-center px-4">
                    {isGenerating ? (
                      <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Generating…</div>
                    ) : (
                      'Generate an image to preview the banner'
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreate}
                disabled={!draft.title.trim() || !draftImage || isSaving}
                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Banner
              </Button>
            </div>
          </div>
        </div>

        {/* Existing banners */}
        <h3 className="text-base font-semibold text-gray-800 mb-3">All banners ({sorted.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#f1889b]" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No banners yet. Create your first one above.</div>
        ) : (
          <div className="space-y-3">
            {sorted.map((item, idx) => {
              const isEditing = editingId === item.id;
              return (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-white border border-gray-200">
                  <div className="w-full sm:w-40 aspect-[16/9] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    {!item.is_active && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">Hidden</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editDraft.title}
                          onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                          placeholder="Title"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={editDraft.subtitle}
                          onChange={(e) => setEditDraft({ ...editDraft, subtitle: e.target.value })}
                          placeholder="Subtitle"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={editDraft.link_url}
                          onChange={(e) => setEditDraft({ ...editDraft, link_url: e.target.value })}
                          placeholder="Link URL"
                          className="h-8 text-sm"
                        />
                        <Textarea
                          value={editDraft.ai_prompt}
                          onChange={(e) => setEditDraft({ ...editDraft, ai_prompt: e.target.value })}
                          placeholder="AI prompt (used for regeneration)"
                          className="text-sm h-16"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-semibold text-gray-800 truncate">{item.title}</h4>
                        {item.subtitle && <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>}
                        {item.link_url && (
                          <a href={item.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 truncate max-w-full">
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate">{item.link_url}</span>
                          </a>
                        )}
                        {item.ai_prompt && (
                          <p className="text-[11px] text-gray-400 italic mt-1 line-clamp-2">Prompt: {item.ai_prompt}</p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-gray-500">Active</span>
                      <Switch checked={!!item.is_active} onCheckedChange={() => handleToggleActive(item)} />
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleMove(item, -1)} disabled={idx === 0} title="Move up">
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleMove(item, 1)} disabled={idx === sorted.length - 1} title="Move down">
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      {isEditing ? (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-green-50" onClick={() => saveEdit(item)} title="Save">
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-blue-50" onClick={() => startEdit(item)} title="Edit">
                          <Edit3 className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-pink-50"
                        onClick={() => handleRegenerate(item)}
                        disabled={regeneratingId === item.id}
                        title="Regenerate image"
                      >
                        {regeneratingId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-[#f1889b]" /> : <Sparkles className="w-4 h-4 text-[#f1889b]" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-50" onClick={() => setConfirmDelete(item)} title="Delete">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmationModal
          type="delete"
          message={`Delete banner "${confirmDelete.title}"?`}
          onConfirm={async () => { await handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}