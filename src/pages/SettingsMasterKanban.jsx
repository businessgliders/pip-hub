import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, BookOpen, ChevronRight, LayoutGrid } from "lucide-react";
import MasterKanbanVersionTracker from "@/components/settings/MasterKanbanVersionTracker";

const subItems = [
  {
    key: "demo",
    title: "Demo / Sandbox",
    description: "Visual sandbox showing the 4-board pattern with fake data. Toggle admin view to test allowedKeys filtering.",
    icon: Play,
    path: "/master-kanban-demo",
    accent: "from-violet-100 to-fuchsia-100 border-violet-200",
    iconBg: "bg-violet-500/10 text-violet-600",
  },
  {
    key: "instructions",
    title: "Instructions",
    description: "SYNC.md template + the canonical prompt to give spoke agents (pip-support / pip-events / pip-partner) when syncing the Master Kanban.",
    icon: BookOpen,
    path: "/settings/master-kanban/instructions",
    accent: "from-amber-100 to-orange-100 border-amber-200",
    iconBg: "bg-amber-500/10 text-amber-700",
  },
];

export default function SettingsMasterKanban() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Settings
          </Button>
        </Link>

        <header className="mb-8 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-fuchsia-500/10 text-fuchsia-600">
            <LayoutGrid className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Master Kanban</h1>
            <p className="text-sm text-slate-500 mt-1">
              Source of truth: <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">components/master-kanban/</code> · Current version <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">v0.1.2</code>
            </p>
          </div>
        </header>

        <div className="mb-6">
          <MasterKanbanVersionTracker />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subItems.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.key} to={s.path} className="group">
                <Card
                  className={`p-5 h-full bg-gradient-to-br ${s.accent} border transition-all hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${s.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{s.title}</h3>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}