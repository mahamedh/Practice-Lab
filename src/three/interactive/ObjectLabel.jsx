import React from "react";
import { Html } from "@react-three/drei";
import { useLabStore } from "../../sim/labStore";

const STYLES = {
  light: "bg-amber-300 text-slate-950",
  water: "bg-sky-400 text-slate-950",
  co2: "bg-slate-200 text-slate-950",
};

export default function ObjectLabel({ variable, label, hint, position, hovered }) {
  const value = useLabStore((s) => s.inputs[variable]);
  const visible = useLabStore((s) => s.stage === "experiment" || s.stage === "apply");
  const selected = useLabStore((s) => s.selectedTool === variable);
  const dragging = useLabStore((s) => s.dragging === variable);
  if (!visible) return null;
  return (
    <Html position={position} center zIndexRange={[10, 0]} className="pointer-events-none select-none">
      <div className="flex flex-col items-center gap-1">
        <div
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold shadow-lg transition ${STYLES[variable]} ${
            selected || dragging ? "scale-110 ring-2 ring-white/80" : "opacity-90"
          }`}
        >
          {label}
          <span className="rounded-full bg-slate-950/80 px-1.5 font-mono text-[11px] text-white tabular-nums">{value}</span>
        </div>
        {(hovered || dragging) && hint && (
          <div className="whitespace-nowrap rounded-md bg-slate-950/80 px-2 py-0.5 text-[11px] font-medium text-white">{hint}</div>
        )}
      </div>
    </Html>
  );
}
