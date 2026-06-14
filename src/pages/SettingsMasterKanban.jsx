import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, LayoutGrid, GitBranch, BookOpen } from "lucide-react";
import MasterKanbanVersionTracker from "@/components/settings/MasterKanbanVersionTracker";
import InstructionsTab from "@/components/settings/master-kanban/InstructionsTab";

export default function SettingsMasterKanban() {
  const [tab, setTab] = useState("versions");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600">
              <ArrowLeft className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Link to="/settings/master-kanban-demo">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Play className="w-4 h-4" />
              Demo / Sandbox
            </Button>
          </Link>
        </div>

        <header className="mb-8 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-fuchsia-500/10 text-fuchsia-600">
            <LayoutGrid className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Master Kanban</h1>
            <p className="text-sm text-slate-500 mt-1">
              Source of truth: <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">components/master-kanban/</code> · Current version <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">v0.1.5</code>
            </p>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="versions" className="gap-1.5">
              <GitBranch className="w-4 h-4" />
              Spoke Versions
            </TabsTrigger>
            <TabsTrigger value="instructions" className="gap-1.5">
              <BookOpen className="w-4 h-4" />
              Instructions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="versions">
            <MasterKanbanVersionTracker />
          </TabsContent>

          <TabsContent value="instructions">
            <InstructionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}