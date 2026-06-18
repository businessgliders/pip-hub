import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ALL_STATUS_META } from "./inboxConfig";

export default function StatusChangeDialog({ open, target, fromStatus, defaultName = "", defaultReason = "", onConfirm, onCancel }) {
  const [name, setName] = useState(defaultName);
  const [reason, setReason] = useState(defaultReason);

  useEffect(() => {
    if (open) { setName(defaultName); setReason(defaultReason); }
  }, [open, defaultName, target]);

  // Keep the reason in sync when an async default (e.g. AI summary) arrives
  // after the dialog has already opened.
  useEffect(() => {
    if (open) setReason(defaultReason);
  }, [defaultReason]); // eslint-disable-line react-hooks/exhaustive-deps

  const toMeta = ALL_STATUS_META[target];
  const fromMeta = ALL_STATUS_META[fromStatus];

  const handleConfirm = () => {
    if (!name.trim() || !reason.trim()) return;
    onConfirm({ name: name.trim(), reason: reason.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 text-sm">
          {fromMeta && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${fromMeta.chip}`}>
              {fromMeta.label}
            </span>
          )}
          <span className="text-muted-foreground">→</span>
          {toMeta && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${toMeta.chip}`}>
              {toMeta.label}
            </span>
          )}
        </div>

        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sc-name">Name <span className="text-rose-500">*</span></Label>
            <Input id="sc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sc-reason">Reason for the change <span className="text-rose-500">*</span></Label>
            <textarea
              id="sc-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Why are you changing the status?"
              className="w-full text-sm px-3 py-2 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!name.trim() || !reason.trim()}>Confirm change</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}