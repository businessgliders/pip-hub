import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Minimize2, X, GripHorizontal } from 'lucide-react';

const DEFAULT_SIZES = {
  clock:      { w: 352, h: 160 },
  calculator: { w: 256, h: 320 },
  hero:       { w: 480, h: 240 },
  agenda:     { w: 360, h: 360 },
  tasks:      { w: 340, h: 360 },
  notes:      { w: 256, h: 256 },
};

const MIN_SIZE = { w: 220, h: 160 };

const parseData = (raw) => {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};

export default function FloatingWidget({ widget, constraintsRef, onUpdateWidget, onDeleteWidget, renderContent }) {
  const initialX = widget.position_x ?? Math.max(20, window.innerWidth / 2 - 160);
  const initialY = widget.position_y ?? Math.max(80, window.innerHeight / 2 - 120);

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const lastSavedPosRef = useRef({ x: initialX, y: initialY });

  // Initial size: from saved data, or per-type default
  const data = parseData(widget.data);
  const defaults = DEFAULT_SIZES[widget.widget_type] || { w: 256, h: 256 };
  const [size, setSize] = useState({
    w: data.float_w ?? defaults.w,
    h: data.float_h ?? defaults.h,
  });

  // If widget.data changes externally (e.g. another field updates), keep our size unless it changed
  useEffect(() => {
    const d = parseData(widget.data);
    if (d.float_w && d.float_h && (d.float_w !== size.w || d.float_h !== size.h)) {
      setSize({ w: d.float_w, h: d.float_h });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.data]);

  const handleDragEnd = () => {
    const newX = Math.max(0, x.get());
    const newY = Math.max(0, y.get());
    if (newX !== lastSavedPosRef.current.x || newY !== lastSavedPosRef.current.y) {
      lastSavedPosRef.current = { x: newX, y: newY };
      onUpdateWidget(widget.id, { position_x: newX, position_y: newY });
    }
  };

  // Resize: pointer-based, persists on release
  const resizingRef = useRef(null);
  const onResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
    };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onResizeEnd);
  };

  const onResizeMove = (e) => {
    const r = resizingRef.current;
    if (!r) return;
    const w = Math.max(MIN_SIZE.w, r.startW + (e.clientX - r.startX));
    const h = Math.max(MIN_SIZE.h, r.startH + (e.clientY - r.startY));
    setSize({ w, h });
  };

  const onResizeEnd = () => {
    window.removeEventListener('pointermove', onResizeMove);
    window.removeEventListener('pointerup', onResizeEnd);
    if (!resizingRef.current) return;
    resizingRef.current = null;
    const merged = { ...parseData(widget.data), float_w: size.w, float_h: size.h };
    onUpdateWidget(widget.id, { data: JSON.stringify(merged) });
  };

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragMomentum={false}
      style={{ x, y, width: size.w, height: size.h }}
      onDragEnd={handleDragEnd}
      className="pointer-events-auto absolute max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden backdrop-blur-xl bg-white/80 border border-white/60 shadow-2xl"
    >
      <div className="h-8 bg-black/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b border-black/5">
        <GripHorizontal className="w-4 h-4 text-gray-400" />
        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onUpdateWidget(widget.id, { is_floating: false })}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
            title="Dock to grid"
          >
            <Minimize2 className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
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

      {/* Free resize handle (bottom-right corner) */}
      <div
        onPointerDown={onResizeStart}
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-20 flex items-end justify-end p-0.5"
        title="Drag to resize"
      >
        <div
          className="w-3 h-3"
          style={{
            background:
              'linear-gradient(135deg, transparent 0 55%, rgba(0,0,0,0.35) 55% 65%, transparent 65% 75%, rgba(0,0,0,0.35) 75% 85%, transparent 85% 100%)',
          }}
        />
      </div>
    </motion.div>
  );
}