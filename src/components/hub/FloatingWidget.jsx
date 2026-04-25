import React, { useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Minimize2, X, GripHorizontal } from 'lucide-react';

export default function FloatingWidget({ widget, constraintsRef, onUpdateWidget, onDeleteWidget, renderContent }) {
  const initialX = widget.position_x ?? Math.max(20, window.innerWidth / 2 - 160);
  const initialY = widget.position_y ?? Math.max(80, window.innerHeight / 2 - 120);

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const lastSavedRef = useRef({ x: initialX, y: initialY });

  const handleDragEnd = () => {
    const newX = Math.max(0, x.get());
    const newY = Math.max(0, y.get());
    if (newX !== lastSavedRef.current.x || newY !== lastSavedRef.current.y) {
      lastSavedRef.current = { x: newX, y: newY };
      onUpdateWidget(widget.id, { position_x: newX, position_y: newY });
    }
  };

  const sizeClasses =
    widget.widget_type === 'clock' ? 'w-[22rem] h-40' :
    widget.widget_type === 'calculator' ? 'w-64 h-[320px]' :
    'w-64 h-64';

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragMomentum={false}
      style={{ x, y }}
      onDragEnd={handleDragEnd}
      className={`pointer-events-auto absolute ${sizeClasses} max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden backdrop-blur-xl bg-white/80 border border-white/60 shadow-2xl`}
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
        {renderContent(widget)}
      </div>
    </motion.div>
  );
}