import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { MasterKanbanBoard } from "@/components/master-kanban";
import { BOARD_CONFIGS, getTheme, statusLabel } from "./boardConfigs";
import SpokeCardContent from "./SpokeCardContent";
import SpokeTicketModal from "./SpokeTicketModal";
import { getColorPalette } from "@/lib/boardColorPalettes";

/**
 * Generic dashboard for one spoke board (support / events / partner).
 * Reads the local hub entity, renders a MasterKanban board, and persists
 * drag-to-new-status changes back to the entity.
 */
export default function SpokeKanbanPage({ boardKey }) {
  const config = BOARD_CONFIGS[boardKey];
  const Entity = base44.entities[config.entityName];
  const queryClient = useQueryClient();
  const queryKey = ["spoke-board", boardKey];
  const colors = getColorPalette(boardKey);

  const [selected, setSelected] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => Entity.list("-created_date", 500),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => Entity.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const columns = config.statuses.map((status) => {
    const theme = getTheme(status);
    return {
      status,
      label: statusLabel(status),
      tickets: records.filter((r) => r.status === status),
      colorClasses: theme.col,
      headerClasses: theme.head,
      isDimmed: config.closedStatuses.includes(status),
      description: undefined,
    };
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId) return;
    updateStatus.mutate({ id: draggableId, status: destination.droppableId });
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: colors.background }}>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#5a3535' }}>{config.title} Board</h1>
              <p className="text-sm" style={{ color: colors.accentPrimary }}>
                {records.length} total · drag cards to update status
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey })}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        <MasterKanbanBoard
          columns={columns}
          onDragEnd={handleDragEnd}
          onTicketClick={(t) => setSelected(t)}
          renderCardContent={(t) => <SpokeCardContent record={t} boardKey={boardKey} />}
        />
      </div>

      <SpokeTicketModal
        record={selected}
        boardKey={boardKey}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}