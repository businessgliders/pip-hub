import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText, Loader2, Headset, CalendarHeart, Handshake } from "lucide-react";
import { VIEW_THEME } from "../inboxConfig";
import TemplateEditor from "./TemplateEditor";

const INBOXES = [
  { key: "support", label: "Support", icon: Headset },
  { key: "events", label: "Events", icon: CalendarHeart },
  { key: "influencer", label: "Influencer", icon: Handshake },
];

const CATEGORY_BY_SOURCE = { support: "Support", events: "Events", influencer: "Influencer" };

export default function TemplatesTab({ initialInbox = "support" }) {
  const [inbox, setInbox] = useState(initialInbox);
  const [editing, setEditing] = useState(null); // template object or {} for new
  const accent = (VIEW_THEME[inbox] || VIEW_THEME.events).accent;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: () => base44.entities.EmailTemplate.list("-created_date", 200),
  });

  // Templates that belong to the selected inbox (by source_app or matching category).
  const list = templates.filter((t) => {
    if (t.source_app) return t.source_app === inbox;
    return t.category === CATEGORY_BY_SOURCE[inbox];
  });

  if (editing) {
    return (
      <TemplateEditor
        sourceApp={inbox}
        accent={accent}
        template={editing}
        onClose={() => setEditing(null)}
        onDeleted={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Inbox selector */}
      <div className="flex flex-wrap items-center gap-1.5 px-1 pb-3">
        {INBOXES.map((b) => {
          const active = inbox === b.key;
          const a = (VIEW_THEME[b.key] || VIEW_THEME.events).accent;
          const Icon = b.icon;
          return (
            <button
              key={b.key}
              onClick={() => setInbox(b.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={active
                ? { backgroundColor: `${a}22`, color: a }
                : { color: "rgb(100 116 139)" }}
            >
              <Icon className="w-3.5 h-3.5" /> {b.label}
            </button>
          );
        })}
      </div>

      {/* New button */}
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-xs text-slate-500 dark:text-white/50">
          {list.length} template{list.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white hover:brightness-95"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto ios-scroll px-1 space-y-2 pb-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-10 text-sm text-slate-400 dark:text-white/40">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No templates for this inbox yet.
          </div>
        ) : (
          list.map((t) => (
            <button
              key={t.id}
              onClick={() => setEditing(t)}
              className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}1f`, color: accent }}>
                  <FileText className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.name}</p>
                  <p className="text-xs text-slate-400 dark:text-white/45 truncate">{t.subject}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}