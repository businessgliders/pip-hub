import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, Minimize2, X, GripHorizontal } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import ClockWidget from './widgets/ClockWidget';
import WeatherWidget from './widgets/WeatherWidget';
import StickyNotesWidget from './widgets/StickyNotesWidget';

const WIDGET_COMPONENTS = {
  clock: ClockWidget,
  weather: WeatherWidget,
  notes: StickyNotesWidget,
};

export default function WidgetsContainer({ widgets = [], isEditMode, onUpdateWidget, onDeleteWidget, onReorderWidgets }) {
  const gridWidgets = widgets.filter(w => !w.is_floating).sort((a, b) => (a.order || 0) - (b.order || 0));
  const floatingWidgets = widgets.filter(w => w.is_floating);

  const renderWidgetContent = (widget) => {
    const Component = WIDGET_COMPONENTS[widget.widget_type];
    if (!Component) return <div className="p-4 text-center text-gray-500">Unknown Widget</div>;
    return <Component widget={widget} />;
  };

  const handleGridDragEnd = (result) => {
    if (!result.destination) return;
    onReorderWidgets(result.source.index, result.destination.index, gridWidgets);
  };

  const handleFloatDragEnd = (widgetId, info) => {
    onUpdateWidget(widgetId, {
      position_x: Math.max(0, info.point.x),
      position_y: Math.max(0, info.point.y)
    });
  };

  return (
    <>
      {/* Grid Widgets */}
      {(gridWidgets.length > 0 || isEditMode) && (
        <div className="mb-8 hidden md:block">
          {isEditMode ? (
            <DragDropContext onDragEnd={handleGridDragEnd}>
              <Droppable droppableId="grid-widgets" direction="horizontal" type="WIDGET">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  >
                    {gridWidgets.map((widget, i) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={i}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{ ...provided.draggableProps.style }}
                            className={`relative h-48 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 hover:border-[#f1889b]/40 transition-colors ${
                              snapshot.isDragging ? 'shadow-2xl z-50 ring-2 ring-[#f1889b]' : 'shadow-sm'
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-black/10 hover:bg-black/20 cursor-grab active:cursor-grabbing transition-colors z-10"
                            />
                            
                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                              <button
                                onClick={() => onUpdateWidget(widget.id, { is_floating: true })}
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
                            
                            <div className={`h-full ${widget.widget_type === 'notes' ? '' : 'pt-4'}`}>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gridWidgets.map(widget => (
                <div key={widget.id} className="relative h-48 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm hover:shadow-md transition-all group">
                  {renderWidgetContent(widget)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Widgets */}
      <div className="fixed inset-0 pointer-events-none z-40 hidden md:block">
        {floatingWidgets.map(widget => (
          <motion.div
            key={widget.id}
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => handleFloatDragEnd(widget.id, info)}
            initial={{ 
              x: widget.position_x || window.innerWidth / 2 - 128, 
              y: widget.position_y || window.innerHeight / 2 - 128 
            }}
            className="pointer-events-auto absolute w-64 h-64 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/80 border border-white/60 shadow-2xl"
          >
            <div className="h-8 bg-black/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b border-black/5">
              <GripHorizontal className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateWidget(widget.id, { is_floating: false })}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
                  title="Dock to grid"
                >
                  <Minimize2 className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={() => onDeleteWidget(widget.id)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-600 transition-colors text-gray-600"
                  title="Remove Widget"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <div className="h-[calc(100%-2rem)]">
              {renderWidgetContent(widget)}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}