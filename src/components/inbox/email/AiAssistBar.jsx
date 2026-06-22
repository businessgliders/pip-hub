import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Lightbulb, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AiAssistBar({ threadId, onApply, showDescribe, showSuggest, suggestState }) {
  if (!showDescribe && !showSuggest) return null;
  return (
    <div className="space-y-3 mt-3">
      {showDescribe && <DescribePanel threadId={threadId} onApply={onApply} />}
      {showSuggest && <SuggestPanel threadId={threadId} onApply={onApply} cache={suggestState} />}
    </div>
  );
}

function DescribePanel({ threadId, onApply }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('aiEmailAssist', {
        mode: 'compose',
        thread_id: threadId,
        description: text,
      });
      if (res?.data?.body_html) {
        onApply(res.data.body_html);
        setText('');
      } else {
        alert('Generate failed: ' + (res?.data?.error || 'no response'));
      }
    } catch (err) {
      alert('Generate failed: ' + (err?.response?.data?.error || err?.message || 'unknown error') + '. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200/70 dark:border-violet-400/20">
      <p className="text-xs font-bold mb-2 flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
        <Sparkles className="w-3.5 h-3.5" /> Describe your reply in simple words
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="e.g. confirm Saturday June 14 at 2pm works, ask if they want the floral add-on"
        className="w-full text-sm px-3 py-2 rounded-lg focus:outline-none resize-none bg-white dark:bg-neutral-900 border border-violet-200/70 dark:border-white/15 text-pink-900 dark:text-white"
      />
      <button
        onClick={handleGenerate}
        disabled={loading || !text.trim()}
        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all disabled:opacity-50 bg-gradient-to-r from-purple-500 to-pink-500"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        {loading ? 'Generating…' : 'Generate'}
      </button>
    </div>
  );
}

function SuggestPanel({ threadId, onApply, cache }) {
  // When a `cache` is supplied by the parent (EmailComposer), use it so the
  // generated replies persist while the panel is toggled off and back on.
  const localSuggestions = useState([]);
  const localMeta = useState({ cached: false, generated_at: null });
  const [suggestions, setSuggestions] = cache?.suggestions ? cache.suggestions : localSuggestions;
  const [meta, setMeta] = cache?.meta ? cache.meta : localMeta;
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [suggestions]);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  const load = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('aiEmailAssist', {
        mode: 'suggest',
        thread_id: threadId,
        force_refresh: forceRefresh,
      });
      if (res?.data?.suggestions) {
        setSuggestions(res.data.suggestions);
        setMeta({ cached: res.data.cached, generated_at: res.data.generated_at });
      } else if (res?.data?.error) {
        alert('Suggestions failed: ' + res.data.error);
      }
    } catch (err) {
      alert('Suggestions failed: ' + (err?.response?.data?.error || err?.message || 'unknown error') + '. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Only fetch if we don't already have suggestions cached for this thread.
  useEffect(() => { if (suggestions.length === 0) load(false); }, [threadId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-200/70 dark:border-violet-400/20">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
          <Lightbulb className="w-3.5 h-3.5" /> Suggested replies
          {meta.generated_at && (
            <span className="ml-2 text-[10px] font-normal text-pink-500/70 dark:text-white/50">
              {meta.cached ? 'Cached · ' : 'Fresh · '}
              generated {formatDistanceToNow(new Date(meta.generated_at), { addSuffix: true })}
            </span>
          )}
        </p>
        <button
          onClick={() => load(true)}
          disabled={loading}
          title="Re-generate (uses AI credits)"
          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-all disabled:opacity-50 bg-white dark:bg-neutral-900 border border-violet-200/70 dark:border-white/15 text-violet-700 dark:text-violet-300"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && suggestions.length === 0 ? (
        <div className="flex items-center gap-2 text-xs py-4 text-pink-500/70 dark:text-white/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
        </div>
      ) : suggestions.length === 0 ? (
        <p className="text-xs py-2 text-pink-500/70 dark:text-white/50">No suggestions available.</p>
      ) : (
        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full shadow-md transition-all hover:scale-110 bg-white dark:bg-neutral-800 border border-violet-200/70 dark:border-white/15 text-violet-700 dark:text-violet-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 items-center justify-center rounded-full shadow-md transition-all hover:scale-110 bg-white dark:bg-neutral-800 border border-violet-200/70 dark:border-white/15 text-violet-700 dark:text-violet-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x', scrollbarWidth: 'thin' }}
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onApply(s.body_html)}
                className="flex-shrink-0 w-64 text-left rounded-lg p-2.5 hover:shadow-md transition-all snap-start bg-white dark:bg-neutral-900 border border-violet-200/70 dark:border-white/15"
              >
                <p className="text-xs font-bold mb-1 text-violet-700 dark:text-violet-300">{s.label}</p>
                <div
                  className="text-xs leading-snug line-clamp-3 text-pink-900/80 dark:text-white/75"
                  dangerouslySetInnerHTML={{ __html: s.body_html }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}