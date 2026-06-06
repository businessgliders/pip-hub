import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import CopyBlock from "../components/settings/CopyBlock";

const SYNC_MD = `# Master Kanban Sync Log

Source of truth: https://github.com/businessgliders/pip-hub
Barrel file: \`src/components/master-kanban/index.jsx\`

## Synced Versions

| Date       | Version | Files Synced                                                          | Changes                                              |
|------------|---------|-----------------------------------------------------------------------|------------------------------------------------------|
| 2026-06-06 | 0.1.1   | All 8 Master Kanban files (first sync)                                | Re-enable drag on touch; remove isDragDisabled gate  |
| 2026-06-06 | 0.1.2   | MasterKanbanColumn.jsx, MasterKanbanCard.jsx, index.jsx               | Theme-able columns + bareCard (back-compatible)      |
`;

const AGENT_PROMPT = `Sync the Master Kanban from pip-hub (source of truth).

1. Fetch ALL of these raw files from pip-hub and overwrite the local copies verbatim.
   This is the full Master Kanban library — always sync the whole set so versions stay
   coherent (don't cherry-pick).

   Components (→ src/components/master-kanban/):
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/index.jsx
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanBoard.jsx
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanColumn.jsx
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterKanbanCard.jsx
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterBoardTabs.jsx
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/components/master-kanban/MasterSwimlaneScroller.jsx

   Hooks (→ src/hooks/):
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/hooks/useHorizontalScroll.js
   - https://raw.githubusercontent.com/businessgliders/pip-hub/main/src/hooks/useIsTouchViewport.js

   NOTE: The barrel file is index.jsx (NOT index.js). Using .js will 404.

2. Read the new MASTER_KANBAN_VERSION constant from index.jsx and tell me what it is.
3. Read the changelog block at the top of index.jsx and summarize what changed.
4. Do NOT edit any spoke-specific files (pages/*, ticket callsites, entities, functions).
   Master Kanban is presentational — callsites don't need updating.
5. Create or update SYNC.md at the project root using the template from pip-hub
   Settings → Master Kanban → Instructions. Add a new row for today's sync.
6. Report back: version synced + files changed + any breaking API changes.
`;

export default function SettingsMasterKanbanInstructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/settings/master-kanban">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-slate-600">
            <ArrowLeft className="w-4 h-4" />
            Master Kanban
          </Button>
        </Link>

        <header className="mb-8 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-700">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Instructions</h1>
            <p className="text-sm text-slate-500 mt-1">
              Copy these into a spoke agent (pip-support / pip-events / pip-partner) to sync the latest Master Kanban.
            </p>
          </div>
        </header>

        <div className="space-y-6">
          <CopyBlock
            title="Agent prompt"
            subtitle="Paste this directly into the spoke agent's chat."
            content={AGENT_PROMPT}
          />

          <CopyBlock
            title="SYNC.md template"
            subtitle="The spoke agent will create / update this at the project root."
            content={SYNC_MD}
          />

          <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Quick references</h3>
            <ul className="text-xs text-slate-600 space-y-1.5">
              <li>
                <span className="text-slate-500">Source repo:</span>{" "}
                <a
                  href="https://github.com/businessgliders/pip-hub/tree/main/src/components/master-kanban"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-fuchsia-600 hover:underline"
                >
                  pip-hub/src/components/master-kanban
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-slate-500">Current version:</span>{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">v0.1.2</code>
              </li>
              <li>
                <span className="text-slate-500">Barrel file:</span>{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">index.jsx</code>{" "}
                <span className="text-slate-400">(not <code>.js</code> — will 404)</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}