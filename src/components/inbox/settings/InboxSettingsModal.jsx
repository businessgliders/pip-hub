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
      <DialogContent className="p-0 gap-0 max-w-4xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] h-[92vh] sm:h-[88vh] max-h-[900px] overflow-hidden rounded-2xl">
        <div className="flex flex-col sm:flex-row h-full min-h-0">
          {/* Sidebar — full column on desktop, compact top bar on mobile */}
          <div className="shrink-0 border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/5 flex sm:flex-col sm:w-40 items-center sm:items-stretch gap-1 p-2 sm:p-3">
            <div className="flex items-center gap-2 px-1 sm:pb-3 sm:mb-1 mr-1 sm:mr-0">
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
                  className="flex items-center gap-2 px-2.5 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-colors sm:mb-0.5"
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
          <div className="flex-1 min-w-0 flex flex-col p-3 sm:p-4">
            {tab === "templates" && <TemplatesTab initialInbox={initialInbox} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}