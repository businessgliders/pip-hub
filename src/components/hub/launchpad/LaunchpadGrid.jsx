import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// iOS-style grid with pointer-driven drag-and-drop:
// • Long-press (or immediate hold in edit mode) starts dragging.
// • The dragged tile follows the pointer; other tiles smoothly reflow via
//   framer-motion's `layout` animation to make room — anywhere in the grid,
//   between rows and columns.
// • On pointer up, we commit a reorder via onReorder(fromIndex, toIndex).
//
// Props:
//   items: Array of { key: string }  (parent provides the visual order)
//   renderItem: (item, { isDragging }) => ReactNode
//   isEditMode: boolean              — drag is enabled only in edit mode
//   onReorder: (from, to) => void
//   gridClassName: string            — Tailwind classes for the grid container
export default function LaunchpadGrid({
  items,
  renderItem,
  isEditMode,
  onReorder,
  gridClassName,
}) {
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map()); // key -> HTMLElement

  // Local visual order during a drag — animates other tiles out of the way.
  const [order, setOrder] = useState(items.map((it) => it.key));
  const [dragKey, setDragKey] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragSize, setDragSize] = useState({ w: 0, h: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const startPointer = useRef({ x: 0, y: 0 });
  const pendingDragKey = useRef(null);
  const pressTimer = useRef(null);

  // Sync local order whenever the parent provides a new items list AND we
  // aren't mid-drag. This way, external changes (search, page change, edits)
  // are reflected immediately.
  useEffect(() => {
    if (dragKey) return;
    setOrder(items.map((it) => it.key));
  }, [items, dragKey]);

  // Build a quick lookup for items by key so we can render in `order` sequence.
  const itemByKey = useMemo(() => {
    const m = new Map();
    items.forEach((it) => m.set(it.key, it));
    return m;
  }, [items]);

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const beginDrag = (key, clientX, clientY) => {
    const el = itemRefs.current.get(key);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
    setDragSize({ w: rect.width, h: rect.height });
    setDragPos({ x: rect.left, y: rect.top });
    setDragKey(key);
  };

  const onPointerDown = (e, key) => {
    if (!isEditMode) return;
    // Ignore clicks on edit-mode action buttons (favorite/edit/delete/hide).
    if (e.target.closest('.lp-action-btn')) return;
    // Only primary button / touch.
    if (e.button !== undefined && e.button !== 0) return;

    pendingDragKey.current = key;
    startPointer.current = { x: e.clientX, y: e.clientY };

    // Start drag almost immediately in edit mode (small hold for click distinction).
    clearPressTimer();
    pressTimer.current = setTimeout(() => {
      if (pendingDragKey.current === key) {
        beginDrag(key, e.clientX, e.clientY);
      }
    }, 120);
  };

  // Compute the closest insertion index based on pointer center.
  const computeInsertIndex = (clientX, clientY) => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < order.length; i++) {
      const key = order[i];
      if (key === dragKey) continue;
      const el = itemRefs.current.get(key);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        // Insert before this tile if pointer is on its left/top half, otherwise after.
        const insertBefore = clientX < cx;
        bestIdx = insertBefore ? i : i + 1;
      }
    }
    // Clamp.
    if (bestIdx < 0) bestIdx = 0;
    if (bestIdx > order.length) bestIdx = order.length;
    return bestIdx;
  };

  // Pointer move/up handlers (attached to window while dragging).
  useEffect(() => {
    if (!dragKey) {
      // While we have a pending press, listen for cancel-style moves to abort.
      const onPendingMove = (e) => {
        if (!pendingDragKey.current) return;
        const dx = Math.abs(e.clientX - startPointer.current.x);
        const dy = Math.abs(e.clientY - startPointer.current.y);
        if (dx > 6 || dy > 6) {
          // Big move before hold completes → start drag immediately.
          const k = pendingDragKey.current;
          clearPressTimer();
          beginDrag(k, e.clientX, e.clientY);
        }
      };
      const onPendingUp = () => {
        clearPressTimer();
        pendingDragKey.current = null;
      };
      window.addEventListener('pointermove', onPendingMove);
      window.addEventListener('pointerup', onPendingUp);
      window.addEventListener('pointercancel', onPendingUp);
      return () => {
        window.removeEventListener('pointermove', onPendingMove);
        window.removeEventListener('pointerup', onPendingUp);
        window.removeEventListener('pointercancel', onPendingUp);
      };
    }

    const onMove = (e) => {
      e.preventDefault();
      const x = e.clientX - dragOffset.current.x;
      const y = e.clientY - dragOffset.current.y;
      setDragPos({ x, y });

      // Reflow: move the dragged key to the computed insertion index.
      const targetIdx = computeInsertIndex(e.clientX, e.clientY);
      setOrder((prev) => {
        const curIdx = prev.indexOf(dragKey);
        if (curIdx === -1) return prev;
        // Convert "insert index" to a destination position in the array of
        // remaining items (excluding the dragged one).
        let to = targetIdx;
        if (curIdx < to) to -= 1;
        if (to === curIdx) return prev;
        const next = prev.slice();
        next.splice(curIdx, 1);
        next.splice(to, 0, dragKey);
        return next;
      });
    };

    const finish = () => {
      const finalOrder = order;
      const originalKeys = items.map((it) => it.key);
      const from = originalKeys.indexOf(dragKey);
      const to = finalOrder.indexOf(dragKey);
      setDragKey(null);
      pendingDragKey.current = null;
      clearPressTimer();
      if (from !== -1 && to !== -1 && from !== to) {
        onReorder?.(from, to);
      } else {
        // No change → snap back to parent's order.
        setOrder(originalKeys);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [dragKey, order, items, onReorder]);

  // Disable native touch scrolling while dragging on touch devices.
  useLayoutEffect(() => {
    if (!dragKey) return;
    const prev = document.body.style.touchAction;
    document.body.style.touchAction = 'none';
    return () => { document.body.style.touchAction = prev; };
  }, [dragKey]);

  const renderTile = (key) => {
    const item = itemByKey.get(key);
    if (!item) return null;
    const isDragging = key === dragKey;
    return (
      <motion.div
        key={key}
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.6 }}
        ref={(el) => {
          if (el) itemRefs.current.set(key, el);
          else itemRefs.current.delete(key);
        }}
        onPointerDown={(e) => onPointerDown(e, key)}
        style={{
          opacity: isDragging ? 0 : 1,
          pointerEvents: isDragging ? 'none' : 'auto',
          touchAction: isEditMode ? 'none' : 'auto',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        className="flex items-start justify-center"
      >
        {renderItem(item, { isDragging })}
      </motion.div>
    );
  };

  // The floating drag preview (rendered last, positioned fixed).
  const draggedItem = dragKey ? itemByKey.get(dragKey) : null;

  return (
    <div ref={containerRef} className={gridClassName}>
      {order.map((k) => renderTile(k))}

      <AnimatePresence>
        {draggedItem && (
          <motion.div
            key="drag-preview"
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            exit={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              left: dragPos.x,
              top: dragPos.y,
              width: dragSize.w,
              height: dragSize.h,
              pointerEvents: 'none',
              zIndex: 100,
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.25))',
            }}
          >
            <div className="flex items-start justify-center">
              {renderItem(draggedItem, { isDragging: true })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}