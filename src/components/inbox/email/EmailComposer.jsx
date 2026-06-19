import { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Lightbulb, Bold, Italic, List, Link as LinkIcon, Send, Trash2, Wand2, X, Loader2, Paperclip, Plus, FileText, CheckCircle2 } from 'lucide-react';
import TemplatePicker from './TemplatePicker';
import AiAssistBar from './AiAssistBar';
import SignaturePopover from './SignaturePopover';
import { displayName } from '../inboxConfig';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isEditorEmpty(html) {
  return !(html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
}

const AUTOSAVE_INTERVAL_MS = 30 * 1000; // 30 seconds

export default function EmailComposer({ thread, currentUser, onSent, onDirtyChange, saveDraftRef }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [showDescribe, setShowDescribe] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  // Lifted AI suggestion cache so generated replies survive toggling the panel.
  const suggestionsState = useState([]);
  const suggestMetaState = useState({ cached: false, generated_at: null });
  const [empty, setEmpty] = useState(true);
  // Tracks whether the current draft was populated from a saved template, so the
  // sent email can be flagged (is_template) and styled distinctly in the thread.
  const [fromTemplate, setFromTemplate] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [draftId, setDraftId] = useState(null);
  const isDirtyRef = useRef(false);
  const savingRef = useRef(false);

  const setDirty = (val) => {
    if (isDirtyRef.current !== val) {
      isDirtyRef.current = val;
      onDirtyChange?.(val);
    }
  };

  // Restore draft on mount (per thread + per user)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUser?.email) return;
      try {
        const rows = await base44.entities.EmailDraft.filter(
          { ticket_id: thread.id, owner_email: currentUser.email },
          '-updated_date',
          1
        );
        if (cancelled || !rows?.[0]) return;
        const draft = rows[0];
        setDraftId(draft.id);
        if (draft.body_html && editorRef.current) {
          editorRef.current.innerHTML = draft.body_html;
          setEmpty(isEditorEmpty(draft.body_html));
        }
        if (Array.isArray(draft.attachments)) {
          setAttachments(draft.attachments.map((a) => ({
            ...a,
            uploading: false,
            previewUrl: null,
            tmpId: a.tmpId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          })));
        }
        if (draft.updated_date) setDraftSavedAt(new Date(draft.updated_date).getTime());
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id, currentUser?.email]);

  const saveDraft = useCallback(async () => {
    if (savingRef.current || !currentUser?.email) return;
    const html = editorRef.current?.innerHTML || '';
    const persistableAttachments = attachments
      .filter((a) => a.url && !a.uploading)
      .map(({ name, size, type, url, tmpId }) => ({ name, size, type, url, tmpId }));
    const hasContent = !isEditorEmpty(html) || persistableAttachments.length > 0;

    savingRef.current = true;
    try {
      if (!hasContent) {
        if (draftId) {
          await base44.entities.EmailDraft.delete(draftId);
          setDraftId(null);
        }
        setDraftSavedAt(null);
        setDirty(false);
        return;
      }
      if (draftId) {
        await base44.entities.EmailDraft.update(draftId, { body_html: html, attachments: persistableAttachments });
      } else {
        const created = await base44.entities.EmailDraft.create({
          ticket_id: thread.id,
          owner_email: currentUser.email,
          body_html: html,
          attachments: persistableAttachments,
        });
        if (created?.id) setDraftId(created.id);
      }
      setDraftSavedAt(Date.now());
      setDirty(false);
    } finally {
      savingRef.current = false;
    }
  }, [attachments, thread.id, currentUser?.email, draftId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic auto-save
  useEffect(() => {
    const id = setInterval(() => { if (isDirtyRef.current) saveDraft(); }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [saveDraft]);

  // Expose imperative save + discard to parent
  useEffect(() => {
    if (saveDraftRef) {
      saveDraftRef.current = {
        save: () => saveDraft(),
        discard: async () => {
          if (editorRef.current) editorRef.current.innerHTML = '';
          setEmpty(true);
          setAttachments([]);
          if (draftId) {
            try { await base44.entities.EmailDraft.delete(draftId); } catch { /* ignore */ }
            setDraftId(null);
          }
          setDraftSavedAt(null);
          isDirtyRef.current = false;
          onDirtyChange?.(false);
        },
      };
    }
  }, [saveDraft, thread.id, saveDraftRef, onDirtyChange, draftId]);

  // Warn on browser navigation/refresh while dirty
  useEffect(() => {
    const handler = (e) => {
      if (isDirtyRef.current) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const clearDraftStorage = async () => {
    if (draftId) {
      try { await base44.entities.EmailDraft.delete(draftId); } catch { /* ignore */ }
      setDraftId(null);
    }
    setDraftSavedAt(null);
    setDirty(false);
  };

  const setEditorHtml = (html) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      setEmpty(isEditorEmpty(html));
      setDirty(true);
    }
  };

  const getEditorHtml = () => editorRef.current?.innerHTML || '';

  const handleInput = () => {
    setEmpty(isEditorEmpty(getEditorHtml()));
    setDirty(true);
  };

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL');
    if (url) exec('createLink', url);
  };

  const handleSend = async () => {
    const html = getEditorHtml();
    if (isEditorEmpty(html)) return;
    setSending(true);
    const readyAttachments = attachments
      .filter((a) => a.url && !a.uploading)
      .map((a) => ({ url: a.url, filename: a.name, contentType: a.type, size: a.size }));
    const res = await base44.functions.invoke('sendThreadReply', {
      thread_id: thread.id,
      body_html: html,
      attachments: readyAttachments,
      is_template: fromTemplate,
    });
    setSending(false);
    if (res?.data?.success) {
      setEditorHtml('');
      setFromTemplate(false);
      setAttachments([]);
      setShowDescribe(false);
      setShowSuggest(false);
      clearDraftStorage();
      onSent?.();
    } else {
      alert('Failed to send: ' + (res?.data?.error || 'unknown error'));
    }
  };

  const handleFilesPicked = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const placeholders = files.map((f) => {
      const type = f.type || 'application/octet-stream';
      const isImage = type.startsWith('image/');
      return {
        name: f.name,
        size: f.size,
        type,
        url: null,
        previewUrl: isImage ? URL.createObjectURL(f) : null,
        uploading: true,
        tmpId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
    });
    setAttachments((prev) => [...prev, ...placeholders]);
    setUploadingCount((c) => c + files.length);
    setDirty(true);

    await Promise.all(files.map(async (file, idx) => {
      const tmpId = placeholders[idx].tmpId;
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        const uploadedUrl = res?.file_url || res?.url || res?.data?.file_url || res?.data?.url;
        if (!uploadedUrl) throw new Error('No file_url returned');
        setAttachments((prev) => prev.map((a) => (a.tmpId === tmpId ? { ...a, url: uploadedUrl, uploading: false } : a)));
      } catch (err) {
        setAttachments((prev) => prev.filter((a) => a.tmpId !== tmpId));
        alert(`Failed to upload ${file.name}: ${err.message || ''}`);
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }));
  };

  const removeAttachment = (tmpId) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.tmpId === tmpId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.tmpId !== tmpId);
    });
    setDirty(true);
  };

  useEffect(() => {
    return () => { attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePolish = async () => {
    const draft = getEditorHtml();
    if (isEditorEmpty(draft)) return;
    setPolishing(true);
    const res = await base44.functions.invoke('aiEmailAssist', { mode: 'polish', thread_id: thread.id, draft });
    setPolishing(false);
    if (res?.data?.body_html) setEditorHtml(res.data.body_html);
  };

  const handleClear = () => {
    if (!isEditorEmpty(getEditorHtml()) && !window.confirm('Clear the draft?')) return;
    setEditorHtml('');
    setFromTemplate(false);
    setAttachments([]);
    clearDraftStorage();
  };

  const formatSavedTime = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTemplate = ({ body_html }) => { setEditorHtml(body_html); setFromTemplate(true); };

  return (
    <div className="rounded-2xl p-3 flex-shrink-0 max-h-[60vh] overflow-y-auto bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-white/70 dark:border-white/15 shadow-sm">
      {/* Recipient */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-pink-700/70 dark:text-white/60">
          To: <span className="font-semibold text-pink-900 dark:text-white">{displayName(thread.contact_name, thread.contact_email) || thread.contact_email}</span>
        </p>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <button
          onClick={() => { setShowDescribe((v) => !v); setShowSuggest(false); }}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all border ${showDescribe ? 'bg-violet-600 text-white border-violet-600' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-400/20'}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Describe in simple words
        </button>
        <button
          onClick={() => { setShowSuggest((v) => !v); setShowDescribe(false); }}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all border ${showSuggest ? 'bg-violet-600 text-white border-violet-600' : 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-400/20'}`}
        >
          <Lightbulb className="w-3.5 h-3.5" /> Suggest replies
        </button>
        <TemplatePicker thread={thread} currentUser={currentUser} onSelect={handleTemplate} />
      </div>

      {/* AI panels */}
      <AiAssistBar
        threadId={thread.id}
        showDescribe={showDescribe}
        showSuggest={showSuggest}
        suggestState={{ suggestions: suggestionsState, meta: suggestMetaState }}
        onApply={(html) => setEditorHtml(html)}
      />

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 mt-3 pb-2 mb-2 border-b border-pink-100/60 dark:border-white/10">
        <button onClick={() => exec('bold')} className="p-1.5 rounded hover:bg-pink-50 dark:hover:bg-white/10" title="Bold"><Bold className="w-3.5 h-3.5 text-pink-900/70 dark:text-white/70" /></button>
        <button onClick={() => exec('italic')} className="p-1.5 rounded hover:bg-pink-50 dark:hover:bg-white/10" title="Italic"><Italic className="w-3.5 h-3.5 text-pink-900/70 dark:text-white/70" /></button>
        <button onClick={() => exec('insertUnorderedList')} className="p-1.5 rounded hover:bg-pink-50 dark:hover:bg-white/10" title="Bullet list"><List className="w-3.5 h-3.5 text-pink-900/70 dark:text-white/70" /></button>
        <button onClick={handleLink} className="p-1.5 rounded hover:bg-pink-50 dark:hover:bg-white/10" title="Insert link"><LinkIcon className="w-3.5 h-3.5 text-pink-900/70 dark:text-white/70" /></button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder="Write your reply…"
        className="prose prose-sm max-w-none focus:outline-none px-3 py-2 rounded-lg empty:before:content-[attr(data-placeholder)] empty:before:text-pink-300 dark:empty:before:text-white/40 bg-white dark:bg-neutral-900 border border-pink-200/50 dark:border-white/15 text-pink-900 dark:text-white"
        style={{ minHeight: 80, maxHeight: 240, overflowY: 'auto', fontSize: '14px' }}
      />

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {attachments.map((a) => {
            const isImage = a.type?.startsWith('image/');
            if (isImage && a.previewUrl) {
              return (
                <div
                  key={a.tmpId}
                  className="relative group rounded-md overflow-hidden border border-pink-200/60 dark:border-white/15 bg-white dark:bg-neutral-900"
                  title={`${a.name}${a.size ? ` · ${formatBytes(a.size)}` : ''}`}
                >
                  <img src={a.previewUrl} alt={a.name} className="block object-cover" style={{ width: 64, height: 64 }} />
                  {a.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(a.tmpId)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-white/90 hover:bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <X className="w-3 h-3 text-pink-900/80" />
                  </button>
                </div>
              );
            }
            return (
              <div
                key={a.tmpId}
                className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-pink-100/50 dark:bg-white/10 border border-pink-200/60 dark:border-white/15 text-pink-900/80 dark:text-white/80"
              >
                {a.uploading ? <Loader2 className="w-3 h-3 animate-spin text-rose-500" /> : <FileText className="w-3 h-3 text-rose-500" />}
                <span className="max-w-[180px] truncate font-medium">{a.name}</span>
                {a.size ? <span className="text-[10px] text-pink-500/70 dark:text-white/50">{formatBytes(a.size)}</span> : null}
                <button onClick={() => removeAttachment(a.tmpId)} className="ml-0.5 p-0.5 rounded-full hover:bg-pink-100 dark:hover:bg-white/10" title="Remove">
                  <X className="w-3 h-3 text-pink-500/70" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesPicked} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Attach files"
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full transition-all bg-pink-50 dark:bg-white/10 text-rose-600 dark:text-rose-300 border border-pink-200/70 dark:border-white/15"
          >
            <Plus className="w-3.5 h-3.5" />
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handlePolish}
            disabled={polishing || empty}
            title="Polish"
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 lg:px-3 rounded-full transition-all disabled:opacity-50 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/70 dark:border-violet-400/20"
          >
            {polishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClear}
            disabled={empty && attachments.length === 0}
            title="Clear"
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 lg:px-3 rounded-full transition-all disabled:opacity-50 bg-pink-100/40 dark:bg-white/5 text-pink-700/70 dark:text-white/60 border border-pink-200/50 dark:border-white/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {draftSavedAt && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400" title={`Draft auto-saved at ${new Date(draftSavedAt).toLocaleString()}`}>
              <CheckCircle2 className="w-3 h-3" />
              Draft saved {formatSavedTime(draftSavedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
        <SignaturePopover currentUser={currentUser} />
        <button
          onClick={handleSend}
          disabled={sending || empty || uploadingCount > 0}
          title="Send Reply"
          className="flex items-center gap-2 text-white px-2.5 py-2 lg:px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-md"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{sending ? 'Sending…' : uploadingCount > 0 ? 'Uploading…' : 'Send Reply'}</span>
        </button>
        </div>
      </div>
    </div>
  );
}