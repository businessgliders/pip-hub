import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitBranch } from "lucide-react";
import MasterKanbanVersionTracker from "@/components/settings/MasterKanbanVersionTracker";

export default function SettingsMasterKanbanVersions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/settings/master-kanban">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Master Kanban
          </Button>
        </Link>

        <header className="mb-8 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
            <GitBranch className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Spoke Version Tracker</h1>
            <p className="text-sm text-slate-500 mt-1">
              Live comparison of the hub's <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">MASTER_KANBAN_VERSION</code> against each spoke repo.
            </p>
          </div>
        </header>

        <MasterKanbanVersionTracker />
      </div>
    </div>
  );
}