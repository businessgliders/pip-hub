import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

export default function ComposeFooter({ onSend, sending }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    const html = text.trim().replace(/\n/g, "<br/>");
    onSend(html, () => setText(""));
  };

  return (
    <div className="border-t border-white/50 dark:border-white/10 p-3">
      <div className="rounded-3xl bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-white/70 dark:border-white/15 p-2 shadow-sm">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your reply here… (sent via Gmail)"
          className="resize-none h-20 border-0 bg-transparent focus-visible:ring-0 shadow-none placeholder:text-pink-300 dark:placeholder:text-white/40 text-pink-900 dark:text-white"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={submit}
            disabled={sending || !text.trim()}
            className="gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md border-0"
          >
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}