import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LayoutGrid, ChevronRight, Inbox } from "lucide-react";

const settingsCards = [
  {
    key: "inbox",
    title: "Unified Inbox",
    description: "CRM-style inbox for all inbound submissions from pip-support / pip-events / pip-partner. Threaded conversations linked to client contacts.",
    icon: Inbox,
    path: "/inbox",
    accent: "from-blue-100 to-indigo-100 border-blue-200",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    key: "master-kanban",
    title: "Master Kanban",
    description: "Canonical kanban library shared across pip-support / pip-events / pip-partner. Demo + sync instructions for spoke agents.",
    icon: LayoutGrid,
    path: "/settings/master-kanban",
    accent: "from-fuchsia-100 to-pink-100 border-fuchsia-200",
    iconBg: "bg-fuchsia-500/10 text-fuchsia-600",
  },
];

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hub-level reference, sync tooling, and shared-library admin.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsCards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.key} to={c.path} className="group">
                <Card
                  className={`p-5 h-full bg-gradient-to-br ${c.accent} border transition-all hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${c.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900">{c.title}</h3>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {c.description}
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