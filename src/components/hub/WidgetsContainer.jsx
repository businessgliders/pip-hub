import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, X, Maximize } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import ClockWidget from './widgets/ClockWidget';
import ClockWidgetMobile from './widgets/ClockWidgetMobile';
import StickyNotesWidget from './widgets/StickyNotesWidget';
import CalculatorWidget from './widgets/CalculatorWidget';
import AmbientHeroWidget from './widgets/AmbientHeroWidget';
import AgendaWidget from './widgets/AgendaWidget';
import TaskChecklistWidget from './widgets/TaskChecklistWidget';
import FloatingWidget from './FloatingWidget';
import MobileWidgetStack from './MobileWidgetStack';

const WIDGET_COMPONENTS = {
  clock: ClockWidget,
  notes: StickyNotesWidget,
  calculator: CalculatorWidget,
  hero: AmbientHeroWidget,
  agenda: AgendaWidget,
  tasks: TaskChecklistWidget,
};

// Widgets that fill their container themselves (no top padding for drag handle)
const FULL_CONTAINER_WIDGETS = new Set(['notes', 'calculator', 'clock', 'hero', 'agenda', 'tasks']);

// ── UNIFIED SIZE SYSTEM ─────────────────────────────────────────────────
// Every widget supports three sizes: S (1 col), M (2 col), L (3 col, full width).
// On mobile (2-col grid), all sizes span the full row for readability.
// All sizes share the same height — only the column span changes.
const UNIFIED_HEIGHT = 'h-36 sm:h-72';
const MOBILE_HEIGHT = 'h-36';
// Widgets that need the full height to be usable — hidden on mobile when shrunk
const WIDGETS_HIDDEN_ON_MOBILE = new Set(['calculator']);
const SIZE_PRESETS = [
  { label: 'S', span: 'col-span-2 sm:col-span-1',                     height: UNIFIED_HEIGHT },
  { label: 'M', span: 'col-span-2 sm:col-span-2',                     height: UNIFIED_HEIGHT },
  { label: 'L', span: 'col-span-2 sm:col-span-3 lg:col-span-4',       height: UNIFIED_HEIGHT },
];

// Per-widget default size index when the widget is first placed.
const DEFAULT_SIZE_IDX = {
  clock: 1,       // M
  notes: 0,       // S
  calculator: 0,  // S
  hero: 1,        // M
  agenda: 1,      // M
  tasks: 1,       // M
};

const parseWidgetData = (widget) => {
  if (!widget?.data) return {};
  try { return JSON.parse(widget.data); } catch { return {}; }
};

// Active breakpoint: 'mobile' (<640), 'tablet' (640–1023), 'desktop' (≥1024)
const getBreakpoint = () => {
  if (typeof window === 'undefined') return 'desktop';
  if (window.innerWidth < 640) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
};

// Per-breakpoint size key — sizes are saved separately per screen size.
const sizeKeyFor = (bp) => `sizeIdx_${bp}`; // sizeIdx_mobile | sizeIdx_tablet | sizeIdx_desktop

const getSizeIdx = (widget, bp) => {
  const d = parseWidgetData(widget);
  // Prefer per-breakpoint, then legacy unified key, then any legacy per-bp variant, then default.
  const val =
    d[sizeKeyFor(bp)] ??
    d.sizeIdx ??
    d[`sizeIdx${bp.charAt(0).toUpperCase() + bp.slice(1)}`];
  if (typeof val === 'number') return Math.min(Math.max(val, 0), SIZE_PRESETS.length - 1);
  return DEFAULT_SIZE_IDX[widget.widget_type] ?? 0;
};

const getResolvedLayout = (widget, bp) => SIZE_PRESETS[getSizeIdx(widget, bp)];

export default function WidgetsContainer({ widgets = [], isEditMode, onUpdateWidget, onDeleteWidget, onReorderWidgets }) {
  const allGridWidgets = widgets.filter(w => !w.is_floating).sort((a, b) => (a.order || 0) - (b.order || 0));
  const floatingWidgets = widgets.filter(w => w.is_floating);
  const constraintsRef = useRef(null);

  const [breakpoint, setBreakpoint] = useState(getBreakpoint());
  useEffect(() => {
    const onResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isMobile = breakpoint === 'mobile';
  // On mobile, hide widgets that don't render well at half height (e.g. calculator)
  const gridWidgets = isMobile
    ? allGridWidgets.filter(w => !WIDGETS_HIDDEN_ON_MOBILE.has(w.widget_type))
    : allGridWidgets;

  const renderWidgetContent = (widget) => {
    if (widget.widget_type === 'clock' && isMobile) {
      return <ClockWidgetMobile widget={widget} />;
    }
    const Component = WIDGET_COMPONENTS[widget.widget_type];
    if (!Component) return <div className="p-4 text-center text-gray-500">Unknown Widget</div>;
    return <Component widget={widget} />;
  };

  const handleGridDragEnd = (result) => {
    if (!result.destination) return;
    onReorderWidgets(result.source.index, result.destination.index, gridWidgets);
  };

  const cycleSize = (widget) => {
    const next = (getSizeIdx(widget, breakpoint) + 1) % SIZE_PRESETS.length;
    const data = parseWidgetData(widget);
    onUpdateWidget(widget.id, { data: JSON.stringify({ ...data, [sizeKeyFor(breakpoint)]: next }) });
  };

  // Pop out to floating — uses mousedown to fire instantly on first click
  // (avoids focus/blur races that previously required a page reload).
  const popOut = (widget) => {
    onUpdateWidget(widget.id, {
      is_floating: true,
      position_x: Math.max(20, window.innerWidth / 2 - 160),
      position_y: Math.max(80, window.innerHeight / 2 - 120),
    });
  };

  return (
    <>
      {/* Grid Widgets */}
      {(gridWidgets.length > 0 || isEditMode) && (
        <div className="mb-8">
          {/* Mobile (non-edit): stacked swipeable carousel */}
          {isMobile && !isEditMode && gridWidgets.length > 0 ? (
            <MobileWidgetStack
              widgets={gridWidgets}
              renderContent={renderWidgetContent}
              onPopOut={popOut}
              height={MOBILE_HEIGHT}
            />
          ) : isEditMode ? (
            <DragDropContext onDragEnd={handleGridDragEnd}>
              <Droppable droppableId="grid-widgets" direction="horizontal" type="WIDGET">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                  >
                    {gridWidgets.map((widget, i) => {
                      const layout = getResolvedLayout(widget, breakpoint);
                      return (
                        <Draggable key={widget.id} draggableId={widget.id} index={i}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{ ...provided.draggableProps.style }}
                              className={`relative ${layout.height} ${layout.span} rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 hover:border-[#f1889b]/40 transition-colors group ${
                                snapshot.isDragging ? 'shadow-2xl z-50 ring-2 ring-[#f1889b]' : 'shadow-sm'
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-black/10 hover:bg-black/20 cursor-grab active:cursor-grabbing transition-colors z-10"
                              />

                              <div className="absolute top-2 right-2 flex gap-1 z-20">
                                <button
                                  onClick={() => cycleSize(widget)}
                                  className="h-6 px-1.5 flex items-center gap-1 rounded-md bg-white/80 hover:bg-pink-50 transition-colors border border-white/60 shadow-sm"
                                  title="Resize"
                                >
                                  <Maximize className="w-3.5 h-3.5 text-[#f1889b]" />
                                  <span className="text-[10px] font-semibold text-[#f1889b]">
                                    {SIZE_PRESETS[getSizeIdx(widget, breakpoint)].label}
                                  </span>
                                </button>
                                <button
                                  onMouseDown={(e) => { e.stopPropagation(); popOut(widget); }}
                                  className="w-6 h-6 flex items-center justify-center rounded-md bg-white/80 hover:bg-blue-50 transition-colors border border-white/60 shadow-sm"
                                  title="Pop out (Float)"
                                >
                                  <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                                </button>
                                <button
                                  onClick={() => onDeleteWidget(widget.id)}
                                  className="w-6 h-6 flex items-center justify-center rounded-md bg-white/80 hover:bg-red-50 transition-colors border border-white/60 shadow-sm"
                                  title="Remove Widget"
                                >
                                  <X className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>

                              <div className={`h-full ${FULL_CONTAINER_WIDGETS.has(widget.widget_type) ? '' : 'pt-4'}`}>
                                {renderWidgetContent(widget)}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gridWidgets.map(widget => {
                const layout = getResolvedLayout(widget, breakpoint);
                return (
                  <div
                    key={widget.id}
                    className={`relative ${layout.height} ${layout.span} rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm hover:shadow-md transition-all group`}
                  >
                    {/* Hover-only pop-out button.
                        Uses onMouseDown so it fires on the very first click — no focus race. */}
                    <button
                      type="button"
                      onMouseDown={(e) => { e.stopPropagation(); popOut(widget); }}
                      className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-md bg-white/80 hover:bg-blue-50 transition-all border border-white/60 shadow-sm opacity-0 group-hover:opacity-100"
                      title="Pop out (Float)"
                      aria-label="Pop out widget"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                    <div className={`h-full ${FULL_CONTAINER_WIDGETS.has(widget.widget_type) ? '' : 'pt-4'}`}>
                      {renderWidgetContent(widget)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Widgets — portaled to body to escape backdrop-blur stacking contexts.
          z-index: 45 sits above sticky page content (z-10/20/30) but BELOW modals (z-50). */}
      {typeof document !== 'undefined' && createPortal(
        <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 45 }}>
          {floatingWidgets.map(widget => (
            <FloatingWidget
              key={widget.id}
              widget={widget}
              constraintsRef={constraintsRef}
              onUpdateWidget={onUpdateWidget}
              onDeleteWidget={onDeleteWidget}
              renderContent={renderWidgetContent}
            />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}