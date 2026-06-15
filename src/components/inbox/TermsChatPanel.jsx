import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Loader2, BookOpen } from "lucide-react";

const SUGGESTIONS = [
  "What is the cancellation policy?",
  "Can clients bring guests?",
  "What's the late arrival policy?",
  "Are refunds allowed?",
];

export default function TermsChatPanel({ open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-pink-500" /> Terms Assistant
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">Ask about studio policies — answers are based on the live Terms page.</p>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="flex flex-col items-center text-center py-6 text-muted-foreground">
                <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Quick answers about Pilates in Pink policies.</p>
              </div>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg border bg-muted/40 hover:bg-muted transition-colors"
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
                  m.role === "user" ? "bg-pink-500 text-white" : "bg-muted border"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted border rounded-2xl px-3.5 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking the terms…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); ask(); }}
          className="p-3 border-t flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a policy…"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}