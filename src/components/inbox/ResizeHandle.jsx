import React, { useCallback } from "react";

// Reports the live pointer clientX while dragging so the parent can compute width.
export default function ResizeHandle({ onDrag }) {
  const startDrag = useCallback((startEvent) => {
    startEvent.preventDefault();
    const move = (e) => onDrag(e.clientX);
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [onDrag]);

  return (
    <div
      onMouseDown={startDrag}
      className="hidden md:block w-1.5 shrink-0 cursor-col-resize rounded-full bg-white/40 hover:bg-pink-300/70 active:bg-pink-400 transition-colors z-10"
      title="Drag to resize"
    />
  );
}