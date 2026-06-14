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
    <div className="border-t border-slate-200 p-3 bg-white">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply… (sent via Gmail)"
        className="resize-none h-24 border-slate-200"
      />
      <div className="flex justify-end mt-2">
        <Button size="sm" onClick={submit} disabled={sending || !text.trim()} className="gap-1.5">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? "Sending…" : "Send reply"}
        </Button>
      </div>
    </div>
  );
}