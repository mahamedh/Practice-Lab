import React, { useEffect, useState } from "react";
import { useLabStore } from "../../sim/labStore";
import { cn } from "../ui";

let lastPointer = { x: 0, y: 0 };

// Draggable chip. On release, the element under the pointer with a matching data-drop wins.
export function DragToken({ id, label, accepts, onDrop, disabled, className, children }) {
  const setDragToken = useLabStore((s) => s.setDragToken);
  const dragging = useLabStore((s) => s.dragToken?.id === id);

  const onPointerDown = (e) => {
    if (disabled) return;
    e.preventDefault();
    lastPointer = { x: e.clientX, y: e.clientY };
    setDragToken({ id, label, accepts, className });
    const move = (ev) => {
      lastPointer = { x: ev.clientX, y: ev.clientY };
      window.dispatchEvent(new CustomEvent("token-move"));
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const target = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-drop]");
      const dropId = target?.getAttribute("data-drop");
      setDragToken(null);
      if (dropId && accepts.includes(dropId)) onDrop(dropId);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <button
      type="button"
      data-token={id}
      disabled={disabled}
      onPointerDown={onPointerDown}
      className={cn(
        "cursor-grab touch-none select-none rounded-full font-bold shadow-lg transition active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40",
        dragging && "opacity-30",
        className
      )}
    >
      {children ?? label}
    </button>
  );
}

export function DropZone({ id, active, className, children }) {
  const dragToken = useLabStore((s) => s.dragToken);
  const accepting = active !== false && dragToken?.accepts?.includes(id);
  return (
    <div data-drop={id} className={cn("transition", accepting && "ring-2 ring-lime-300 ring-offset-2 ring-offset-slate-950", className)}>
      {children}
    </div>
  );
}

export function DragLayer() {
  const token = useLabStore((s) => s.dragToken);
  const [pos, setPos] = useState(lastPointer);
  useEffect(() => {
    if (!token) return;
    setPos(lastPointer);
    const onMove = () => setPos({ ...lastPointer });
    window.addEventListener("token-move", onMove);
    return () => window.removeEventListener("token-move", onMove);
  }, [token]);
  if (!token) return null;
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[200]" style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}>
      <div className={cn("-translate-x-1/2 -translate-y-1/2 scale-110 rounded-full font-bold shadow-2xl ring-2 ring-white/80", token.className)}>{token.label}</div>
    </div>
  );
}
