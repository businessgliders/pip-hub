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

  const data = parseData(widget.data);
  const defaults = DEFAULT_SIZES[widget.widget_type] || { w: 256, h: 256 };
  const [size, setSize] = useState({
    w: data.float_w ?? defaults.w,
    h: data.float_h ?? defaults.h,
  });

  // Sync from external widget.data updates (only if changed)
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

  // ── Resize: pointer-capture based for reliability + real-time visual feedback ──
  const [isResizing, setIsResizing] = useState(false);
  const resizeStateRef = useRef(null);

  const onResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Capture pointer so motion drag never steals it
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
    };
    setIsResizing(true);
  };

  const onResizePointerMove = (e) => {
    const r = resizeStateRef.current;
    if (!r || e.pointerId !== r.pointerId) return;
    const w = Math.max(MIN_SIZE.w, r.startW + (e.clientX - r.startX));
    const h = Math.max(MIN_SIZE.h, r.startH + (e.clientY - r.startY));
    setSize({ w, h });
  };

  const onResizePointerUp = (e) => {
    const r = resizeStateRef.current;
    if (!r) return;
    try { e.currentTarget.releasePointerCapture(r.pointerId); } catch { /* ignore */ }
    resizeStateRef.current = null;
    setIsResizing(false);
    const merged = { ...parseData(widget.data), float_w: size.w, float_h: size.h };
    onUpdateWidget(widget.id, { data: JSON.stringify(merged) });
  };

  return (
    <motion.div
      drag={!isResizing}
      dragConstraints={constraintsRef}
      dragMomentum={false}
      style={{ x, y, width: size.w, height: size.h }}
      onDragEnd={handleDragEnd}
      className="pointer-events-auto absolute max-w-[calc(100vw-1rem)] rounded-2xl overflow-hidden backdrop-blur-xl bg-white/80 border border-white/60 shadow-2xl"
    >
      <div className="h-8 bg-black/5 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b border-black/5 select-none">
        <GripHorizontal className="w-4 h-4 text-gray-400" />
        <div className="flex items-center gap-1">
          {/* Use onPointerUp + stopPropagation so framer-motion's drag never swallows the click */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => {
              e.stopPropagation();
              onUpdateWidget(widget.id, { is_floating: false });
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
            title="Dock to grid"
            aria-label="Dock to grid"
          >
            <Minimize2 className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => {
              e.stopPropagation();
              onDeleteWidget(widget.id);
            }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-600 transition-colors text-gray-600"
            title="Remove Widget"
            aria-label="Remove Widget"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="h-[calc(100%-2rem)]">
        {renderContent(widget)}
      </div>

      {/* Free resize handle (bottom-right corner) — uses pointer capture for reliable, real-time resize */}
      <div
        onPointerDown={onResizeStart}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
        className={`absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20 flex items-end justify-end p-1 touch-none ${
          isResizing ? 'bg-[#f1889b]/10' : ''
        }`}
        title="Drag to resize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" className="opacity-60">
          <path d="M11 1 L1 11 M11 5 L5 11 M11 9 L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </motion.div>
  );
}