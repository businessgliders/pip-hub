import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const FIELD_LABELS = {
  name: "Name", email: "Email", phone: "Phone", subject: "Subject",
  message: "Message", event_type: "Event Type", event_date: "Event Date",
  guest_count: "Guests", company: "Company", social_handle: "Social / Site",
  partnership_type: "Partnership Type", priority: "Priority",
  status: "Status", source_app: "Source App",
};

const ORDER = [
  "name", "email", "phone", "company", "social_handle", "subject",
  "event_type", "event_date", "guest_count", "partnership_type",
  "priority", "status", "source_app", "message",
];

export default function SpokeTicketModal({ record, boardKey, onClose }) {
  if (!record) return null;

  const fields = ORDER.filter((k) => record[k] !== undefined && record[k] !== null && record[k] !== "");

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{record.name || "Details"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((k) => (
            <div key={k} className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-slate-500">{FIELD_LABELS[k] || k}</span>
              <span className="col-span-2 text-slate-800 whitespace-pre-wrap break-words">
                {String(record[k])}
              </span>
            </div>
          ))}
          {record.created_date && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-slate-500">Received</span>
              <span className="col-span-2 text-slate-800">
                {format(new Date(record.created_date), "PPp")}
              </span>
            </div>
          )}
          {record.extra && Object.keys(record.extra).length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 mb-1">Extra fields</div>
              {Object.entries(record.extra).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="col-span-2 text-slate-800 break-words">{String(v)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}