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

const WIDGET_COMPONENTS = {
  clock: ClockWidget,
  notes: StickyNotesWidget,
  calculator: CalculatorWidget,
  hero: AmbientHeroWidget,
  agenda: AgendaWidget,
  tasks: TaskChecklistWidget,
};

// Widgets with custom layout (size + col-span). Defaults: h-40, 1 col.
const WIDGET_LAYOUT = {
  calculator: { height: 'h-[320px]', span: '' },
  clock:      { height: 'h-40',      span: 'sm:col-span-2' },
  hero:       { height: 'h-56',      span: 'sm:col-span-2 lg:col-span-3' },
  agenda:     { height: 'h-72',      span: 'sm:col-span-2' },
  tasks:      { height: 'h-72',      span: 'sm:col-span-2' },
};

const getLayout = (type) => WIDGET_LAYOUT[type] || { height: 'h-40', span: '' };

// Widgets that fill their container themselves (no top padding for drag handle)
const FULL_CONTAINER_WIDGETS = new Set(['notes', 'calculator', 'clock', 'hero', 'agenda', 'tasks']);

// Resizable widgets — cycle through preset sizes
// Note: col-span-2 (no sm: prefix) ensures Hero takes full width even on mobile (2-col grid)
const HERO_SIZES = [
  { label: 'S', span: 'col-span-2',                     height: 'h-40' },
  { label: 'M', span: 'col-span-2 lg:col-span-3',       height: 'h-56' },
  { label: 'L', span: 'col-span-2 sm:col-span-3 lg:col-span-4', height: 'h-72' },
];

const parseWidgetData = (widget) => {
  if (!widget?.data) return {};
  try { return JSON.parse(widget.data); } catch { return {}; }
};

const AGENDA_SIZES = [
  { label: 'S', span: 'sm:col-span-2',                  height: 'h-56' },
  { label: 'M', span: 'sm:col-span-2',                  height: 'h-72' },
  { label: 'L', span: 'sm:col-span-2 lg:col-span-3',    height: 'h-96' },
];

const TASKS_SIZES = [
  { label: 'S', span: 'sm:col-span-2',                  height: 'h-56' },
  { label: 'M', span: 'sm:col-span-2',                  height: 'h-72' },
  { label: 'L', span: 'sm:col-span-2 lg:col-span-3',    height: 'h-96' },
];

const RESIZABLE_PRESETS = { hero: HERO_SIZES, agenda: AGENDA_SIZES, tasks: TASKS_SIZES };

const getResolvedLayout = (widget) => {
  const presets = RESIZABLE_PRESETS[widget.widget_type];
  if (presets) {
    const { sizeIdx = 1 } = parseWidgetData(widget);
    return presets[Math.min(Math.max(sizeIdx, 0), presets.length - 1)];
  }
  return WIDGET_LAYOUT[widget.widget_type] || { height: 'h-40', span: '' };
};

const isResizable = (type) => Boolean(RESIZABLE_PRESETS[type]);

export default function WidgetsContainer({ widgets = [], isEditMode, onUpdateWidget, onDeleteWidget, onReorderWidgets }) {
  const gridWidgets = widgets.filter(w => !w.is_floating).sort((a, b) => (a.order || 0) - (b.order || 0));
  const floatingWidgets = widgets.filter(w => w.is_floating);
  const constraintsRef = useRef(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    const presets = RESIZABLE_PRESETS[widget.widget_type];
    if (!presets) return;
    const data = parseWidgetData(widget);
    const next = ((data.sizeIdx ?? 1) + 1) % presets.length;
    onUpdateWidget(widget.id, { data: JSON.stringify({ ...data, sizeIdx: next }) });
  };



  return (
    <>
      {/* Grid Widgets */}
      {(gridWidgets.length > 0 || isEditMode) && (
        <div className="mb-8">
          {isEditMode ? (
            <DragDropContext onDragEnd={handleGridDragEnd}>
              <Droppable droppableId="grid-widgets" direction="horizontal" type="WIDGET">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                  >
                    {gridWidgets.map((widget, i) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={i}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{ ...provided.draggableProps.style }}
                            className={`relative ${getResolvedLayout(widget).height} ${getResolvedLayout(widget).span} rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 hover:border-[#f1889b]/40 transition-colors ${
                              snapshot.isDragging ? 'shadow-2xl z-50 ring-2 ring-[#f1889b]' : 'shadow-sm'
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-black/10 hover:bg-black/20 cursor-grab active:cursor-grabbing transition-colors z-10"
                            />

                            <div className="absolute top-2 right-2 flex gap-1 z-20">
                              {isResizable(widget.widget_type) && (
                                <button
                                  onClick={() => cycleSize(widget)}
                                  className="h-6 px-1.5 flex items-center gap-1 rounded-md bg-white/80 hover:bg-pink-50 transition-colors border border-white/60 shadow-sm"
                                  title="Resize"
                                >
                                  <Maximize className="w-3.5 h-3.5 text-[#f1889b]" />
                                  <span className="text-[10px] font-semibold text-[#f1889b]">
                                    {RESIZABLE_PRESETS[widget.widget_type][parseWidgetData(widget).sizeIdx ?? 1].label}
                                  </span>
                                </button>
                              )}
                              <button
                                onClick={() => onUpdateWidget(widget.id, {
                                  is_floating: true,
                                  position_x: Math.max(20, window.innerWidth / 2 - 160),
                                  position_y: Math.max(80, window.innerHeight / 2 - 120),
                                })}
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
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gridWidgets.map(widget => (
                <div key={widget.id} className={`relative ${getResolvedLayout(widget).height} ${getResolvedLayout(widget).span} rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm hover:shadow-md transition-all group`}>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={() => onUpdateWidget(widget.id, {
                        is_floating: true,
                        position_x: Math.max(20, window.innerWidth / 2 - 160),
                        position_y: Math.max(80, window.innerHeight / 2 - 120),
                      })}
                      className="w-6 h-6 flex items-center justify-center rounded-md bg-white/80 hover:bg-blue-50 transition-colors border border-white/60 shadow-sm"
                      title="Pop out (Float)"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  </div>
                  <div className={`h-full ${FULL_CONTAINER_WIDGETS.has(widget.widget_type) ? '' : 'pt-4'}`}>
                    {renderWidgetContent(widget)}
                  </div>
                </div>
              ))}
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