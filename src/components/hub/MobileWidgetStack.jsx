import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Maximize2 } from 'lucide-react';

// Mobile-only stacked widget carousel with swipe gestures.
// Shows the active widget on top, with the next 1-2 widgets peeking behind it
// (scaled down + offset). Swipe left/right to advance.
export default function MobileWidgetStack({ widgets, renderContent, onPopOut, height = 'h-72' }) {
  const [active, setActive] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const dragX = useMotionValue(0);
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);

  // Tap card to reveal pop-out (mobile equivalent of hover); auto-hide after 2.5s
  const revealControls = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  // Hide controls when switching cards
  useEffect(() => { setShowControls(false); }, [active]);

  // Clamp active when widgets list changes (e.g. delete)
  useEffect(() => {
    if (active >= widgets.length) setActive(Math.max(0, widgets.length - 1));
  }, [widgets.length, active]);

  // Active card opacity follows drag (subtle fade as it leaves) — must be called unconditionally
  const activeOpacity = useTransform(dragX, [-200, 0, 200], [0.6, 1, 0.6]);

  if (widgets.length === 0) return null;

  const SWIPE_THRESHOLD = 60;

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      setActive((i) => Math.min(widgets.length - 1, i + 1));
    } else if (offset > SWIPE_THRESHOLD || velocity > 500) {
      setActive((i) => Math.max(0, i - 1));
    }
    dragX.set(0);
  };

  // Visible cards: active + up to 2 behind (peek effect)
  const visible = widgets
    .map((w, i) => ({ widget: w, i }))
    .filter(({ i }) => i >= active && i < active + 3);

  return (
    <div ref={containerRef} className={`relative ${height} mb-8`}>
      <div className="relative w-full h-full">
        {visible.map(({ widget, i }) => {
          const stackIdx = i - active; // 0 = active, 1 = next, 2 = after-next
          const isActive = stackIdx === 0;
          const scale = 1 - stackIdx * 0.05;
          const yOffset = stackIdx * 10;
          const zIndex = 30 - stackIdx;
          const opacityBase = stackIdx === 0 ? 1 : 0.85 - (stackIdx - 1) * 0.25;

          return (
            <motion.div
              key={widget.id}
              className="absolute inset-0 rounded-2xl overflow-hidden backdrop-blur-xl bg-white/40 border border-white/60 shadow-lg"
              style={isActive ? { x: dragX, opacity: activeOpacity, zIndex } : { zIndex }}
              initial={false}
              animate={{
                scale,
                y: yOffset,
                opacity: opacityBase,
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              drag={isActive ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={isActive ? handleDragEnd : undefined}
            >
              {/* Pop-out button — hidden by default, revealed on tap (mobile hover-equivalent) */}
              {isActive && showControls && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.stopPropagation(); onPopOut(widget); }}
                  onTouchStart={(e) => { e.stopPropagation(); onPopOut(widget); }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-md bg-white/90 active:bg-blue-100 border border-white/60 shadow-sm animate-in fade-in"
                  title="Pop out"
                  aria-label="Pop out widget"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                </button>
              )}
              <div className="h-full" onClick={isActive ? revealControls : undefined}>
                {renderContent(widget)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination dots */}
      {widgets.length > 1 && (
        <div className="absolute -bottom-5 left-0 right-0 flex items-center justify-center gap-1.5">
          {widgets.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all ${
                active === i ? 'w-5 h-1.5 bg-gray-700' : 'w-1.5 h-1.5 bg-gray-400/60'
              }`}
              aria-label={`Widget ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}