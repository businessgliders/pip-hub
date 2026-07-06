import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Bell, Bug, Check } from "lucide-react";

// Bump this version whenever there's new "What's New" content to show again.
// The dismissed version is stored per-user, so changing it re-shows the popup.
const WHATS_NEW_VERSION = "2026-07-06";

const ITEMS = [
  {
    Icon: Bell,
    title: "Smarter notifications",
    body: "The bell now groups alerts by inbox and opens the exact item when you click a notification.",
  },
  {
    Icon: Bug,
    title: "Bug tickets open directly",
    body: "Clicking a bug notification jumps straight to that ticket and highlights it in the list.",
  },
];

export default function WhatsNewPopup({ currentUser }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const seen = currentUser.whats_new_seen_version;
    if (seen !== WHATS_NEW_VERSION) setOpen(true);
  }, [currentUser]);

  const markRead = async () => {
    setOpen(false);
    try {
      await base44.auth.updateMe({ whats_new_seen_version: WHATS_NEW_VERSION });
    } catch (_) {
      /* non-fatal — worst case it shows again next session */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) markRead(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-white/50 dark:border-white/15">
        {/* Header */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 px-6 pt-6 pb-5 text-white">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">What's New</h2>
          <p className="text-sm text-white/80 mt-0.5">A few improvements we just shipped.</p>
        </div>

        {/* Items */}
        <div className="px-6 py-5 space-y-4">
          {ITEMS.map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <div className="mt-0.5 w-9 h-9 shrink-0 rounded-xl bg-pink-50 dark:bg-pink-500/15 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-pink-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground leading-snug">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button onClick={markRead} className="w-full bg-pink-500 hover:bg-pink-600 text-white gap-2">
            <Check className="w-4 h-4" /> Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}