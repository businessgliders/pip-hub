import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertTriangle, HelpCircle, ExternalLink, Github } from "lucide-react";
import { MASTER_KANBAN_VERSION as HUB_LOCAL_VERSION } from "@/components/master-kanban";
import { format } from "date-fns";

function StatusPill({ status }) {
  if (status === "up_to_date") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
        <CheckCircle2 className="w-3 h-3" /> Up to date
      </Badge>
    );
  }
  if (status === "behind") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
        <AlertTriangle className="w-3 h-3" /> Out of sync
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
        <AlertTriangle className="w-3 h-3" /> Error
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
      <HelpCircle className="w-3 h-3" /> Unknown
    </Badge>
  );
}

function SpokeRow({ spoke }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 rounded-lg bg-white border border-slate-200">
      <div className="flex items-center gap-3 min-w-0">
        <Github className="w-4 h-4 text-slate-400 shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-slate-900 text-sm">{spoke.key}</div>
          <a
            href={`https://github.com/${spoke.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            {spoke.repo}
            <ExternalLink className="w-3 h-3" />
          </a>
          {spoke.error && (
            <div className="text-xs text-red-600 mt-1 truncate" title={spoke.error}>
              {spoke.error}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <code className="text-sm font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {spoke.version ? `v${spoke.version}` : "—"}
        </code>
        <StatusPill status={spoke.status} />
      </div>
    </div>
  );
}

export default function MasterKanbanVersionTracker() {
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["master-kanban-spoke-versions"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getSpokeKanbanVersions", {});
      return res.data;
    },
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    staleTime: 60 * 1000,
  });

  const hubRemoteVersion = data?.hub?.version;
  const hubMatchesLocal = hubRemoteVersion && hubRemoteVersion === HUB_LOCAL_VERSION;

  return (
    <Card className="p-5 bg-white border-slate-200">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">Spoke Version Tracker</h2>
          <p className="text-xs text-slate-500 mt-1">
            Live read of <code className="bg-slate-100 px-1 rounded">MASTER_KANBAN_VERSION</code> from each spoke's <code className="bg-slate-100 px-1 rounded">main</code> branch on GitHub.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Hub source-of-truth row */}
      <div className="mb-3 p-4 rounded-lg bg-gradient-to-br from-fuchsia-50 to-violet-50 border border-fuchsia-200">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-fuchsia-700 uppercase tracking-wide">Source of truth</div>
            <div className="font-semibold text-slate-900 mt-0.5">pip-hub</div>
            <div className="text-xs text-slate-600 mt-0.5">
              Local (this app): <code className="bg-white/70 px-1 rounded font-mono">v{HUB_LOCAL_VERSION}</code>
              {hubRemoteVersion && (
                <>
                  {" · "}GitHub main: <code className="bg-white/70 px-1 rounded font-mono">v{hubRemoteVersion}</code>
                </>
              )}
            </div>
            {hubRemoteVersion && !hubMatchesLocal && (
              <div className="text-xs text-amber-700 mt-1 inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Local is ahead of GitHub — unpushed changes.
              </div>
            )}
            {data?.hub?.error && (
              <div className="text-xs text-red-600 mt-1">{data.hub.error}</div>
            )}
          </div>
        </div>
      </div>

      {/* Spokes */}
      {isLoading && (
        <div className="text-sm text-slate-500 py-6 text-center">Checking spokes…</div>
      )}

      {error && !isLoading && (
        <div className="text-sm text-red-600 py-4">
          Failed to load: {error.message}
        </div>
      )}

      {data?.spokes && (
        <div className="space-y-2">
          {data.spokes.map((s) => (
            <SpokeRow key={s.key} spoke={s} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          {data?.checked_at && (
            <>Last checked: {format(new Date(data.checked_at), "MMM d, HH:mm:ss")}</>
          )}
        </div>
        <div>
          {data?.token_configured ? (
            <span className="text-emerald-600">GitHub token configured ✓</span>
          ) : (
            <span>Public read · no token</span>
          )}
        </div>
      </div>
    </Card>
  );
}