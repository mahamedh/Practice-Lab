import { useRef, useState } from "react";
import { useLabStore } from "../../sim/labStore";

const INTERACTIVE = ["experiment", "apply"];

export function useGrab(variable, { onStart, onMove, onEnd } = {}) {
  const [hovered, setHovered] = useState(false);
  const active = useRef(false);
  const enabled = useLabStore((s) => INTERACTIVE.includes(s.stage));

  const finish = (e) => {
    if (!active.current) return;
    active.current = false;
    e?.target?.releasePointerCapture?.(e.pointerId);
    const s = useLabStore.getState();
    if (s.controls) s.controls.enabled = true;
    s.setDragging(null);
    onEnd?.(e);
    s.commitChanges();
    document.body.style.cursor = "";
  };

  const handlers = {
    onPointerOver: (e) => {
      if (!enabled) return;
      e.stopPropagation();
      setHovered(true);
      if (!active.current) document.body.style.cursor = "grab";
    },
    onPointerOut: () => {
      setHovered(false);
      if (!active.current) document.body.style.cursor = "";
    },
    onPointerDown: (e) => {
      const s = useLabStore.getState();
      if (!INTERACTIVE.includes(s.stage)) return;
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      if (s.controls) s.controls.enabled = false;
      active.current = true;
      s.setDragging(variable);
      s.selectTool(variable);
      document.body.style.cursor = "grabbing";
      onStart?.(e);
    },
    onPointerMove: (e) => {
      if (!active.current) return;
      e.stopPropagation();
      onMove?.(e);
    },
    onPointerUp: finish,
    onLostPointerCapture: finish,
  };

  return { hovered: hovered && enabled, active, handlers, enabled };
}
