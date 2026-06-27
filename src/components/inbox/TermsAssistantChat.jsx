import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HelpCircle, X, Send, Loader2, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "What is the cancellation policy?",
  "What's the late arrival policy?",
  "How much is a single class?",
  "What membership packages are available?",
];

/**
 * Floating live-chat style Terms Assistant (bottom-right, above the bug button).
 * Answers studio-policy questions based on the live Terms page.
 */
export default function TermsAssistantChat({ accent = "#7c3aed", open: controlledOpen, onOpenChange, hideFloatingButton = false }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v) => { if (isControlled) onOpenChange?.(v); else setInternalOpen(v); };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Desktop only: focus the input when the chat opens. On mobile we leave it
  // un-focused so the user taps first (avoids the iOS keyboard popping + zoom).
  useEffect(() => {
    if (!open) return;
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const ask = async (q) => {
    const question = (q ?? input).trim();
    if (!question || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n");
      const res = await base44.functions.invoke("askTerms", { question, history });
      const answer = res?.data?.answer || res?.data?.error || "Sorry, I couldn't find an answer.";
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Something went wrong. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button — sits to the left of the bug button */}
      {!open && !hideFloatingButton && (
        <button
          onClick={() => setOpen(true)}
          title="Terms Assistant"
          className="fixed bottom-20 lg:bottom-5 right-[84px] z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {/* Backdrop blur while open */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 lg:bottom-5 right-3 lg:right-5 z-50 w-[min(80vw,320px)] lg:w-[380px] h-[min(62vh,500px)] lg:h-[min(80vh,560px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 animate-chat-in origin-bottom">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2.5 text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
            <HelpCircle className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-tight">Terms &amp; Pricing Assistant</p>
              <p className="text-[11px] opacity-80 leading-tight">Answers from the live Terms &amp; Pricing pages</p>
            </div>
            <button
              onClick={() => { setMessages([]); setInput(""); }}
              title="Back to start"
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-neutral-50 dark:bg-neutral-950">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex flex-col items-center text-center py-5 text-muted-foreground">
                  <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Quick answers about Pilates in Pink policies.</p>
                </div>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="w-full text-left text-sm px-3 py-2 rounded-lg border bg-white dark:bg-neutral-800 hover:bg-muted transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user" ? "text-white" : "bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 text-neutral-800 dark:text-neutral-100"
                  }`}
                  style={m.role === "user" ? { background: accent } : undefined}
                >
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_th]:border [&_th]:border-black/10 dark:[&_th]:border-white/15 [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:border-black/10 dark:[&_td]:border-white/15 [&_td]:px-2 [&_td]:py-1"
                    >
                      {m.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 rounded-2xl px-3.5 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Looking it up…
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); ask(); }}
            className="p-3 border-t border-black/10 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-neutral-900"
          >
            <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about a policy or pricing…" disabled={loading} />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} style={{ background: accent }} className="text-white shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}