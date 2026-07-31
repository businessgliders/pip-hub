import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileText, Settings as SettingsIcon, X } from "lucide-react";
import TemplatesTab from "./TemplatesTab";

const TABS = [
  { key: "templates", label: "Templates", icon: FileText },
];

// Inbox settings hub. Currently hosts the email Templates editor; built with a
// sidebar so future settings sections can be added as new tabs.
export default function InboxSettingsModal({ open, onOpenChange, initialInbox = "support", accent = "#f1889b" }) {
  const [tab, setTab] = useState("templates");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl w-[calc(100vw-2rem)] h-[80vh] max-h-[640px] overflow-hidden rounded-2xl">
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <div className="w-40 shrink-0 border-r border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 p-3 flex flex-col">
            <div className="flex items-center gap-2 px-1 pb-3 mb-1">
              <SettingsIcon className="w-4 h-4" style={{ color: accent }} />
              <span className="text-sm font-bold text-slate-800 dark:text-white">Settings</span>
            </div>
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5"
                  style={active
                    ? { backgroundColor: `${accent}1f`, color: accent }
                    : undefined}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col p-4">
            {tab === "templates" && <TemplatesTab initialInbox={initialInbox} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}