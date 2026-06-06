import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * CopyBlock — code/text block with a copy-to-clipboard button.
 * Used on the Master Kanban Instructions page.
 */
export default function CopyBlock({ title, subtitle, content, language = "" }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Select and copy manually." });
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5 h-8"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="text-xs leading-relaxed text-slate-700 p-5 overflow-x-auto whitespace-pre-wrap font-mono bg-white">
        {content}
      </pre>
    </section>
  );
}