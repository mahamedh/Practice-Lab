import React, { useRef, useState } from "react";
import { cn } from "../ui";

const W = 300;
const H = 112;
const PLOT = { left: 30, right: 284, top: 12, bottom: 86 };
const START_X = 64;
const END_X = 252;

const toY = (v) => PLOT.bottom - (v / 100) * (PLOT.bottom - PLOT.top);
const toValue = (y) => Math.max(0, Math.min(100, ((PLOT.bottom - y) / (PLOT.bottom - PLOT.top)) * 100));

export function classifyLine(start, end) {
  if (end - start > 8) return "increase";
  if (end - start < -8) return "decrease";
  return "same";
}

export const CHOICE_LABEL = { increase: "increase", same: "stay the same", decrease: "decrease" };
const PRESETS = { increase: 95, same: 70, decrease: 10 };

export default function WhatIfSketch({ prediction, end, onChange, color = "#f87171" }) {
  const svgRef = useRef();
  const [dragging, setDragging] = useState(false);
  const start = prediction.start;
  const choice = end === null || end === undefined ? null : classifyLine(start, end);

  const update = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    onChange(Math.round(toValue(((e.clientY - rect.top) / rect.height) * H)));
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5" data-whatif={prediction.id}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[13px] font-semibold text-white">{prediction.scenario}</div>
        {choice && <div className="text-[11px] font-semibold" style={{ color }}>{CHOICE_LABEL[choice]}</div>}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={cn("mt-1 w-full touch-none", dragging ? "cursor-grabbing" : "cursor-ns-resize")}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          update(e);
        }}
        onPointerMove={(e) => dragging && update(e)}
        onPointerUp={() => setDragging(false)}
      >
        <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} stroke="rgba(255,255,255,0.3)" />
        <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.left} y2={PLOT.top} stroke="rgba(255,255,255,0.3)" />
        <text x={10} y={(PLOT.top + PLOT.bottom) / 2} fill="rgba(255,255,255,0.5)" fontSize="9" transform={`rotate(-90 10 ${(PLOT.top + PLOT.bottom) / 2})`} textAnchor="middle">
          {prediction.series.split(" (")[0]}
        </text>
        <text x={START_X} y={H - 6} fill="rgba(255,255,255,0.55)" fontSize="10" textAnchor="middle">Now</text>
        <text x={END_X} y={H - 6} fill="rgba(255,255,255,0.55)" fontSize="10" textAnchor="middle">After the change</text>
        {choice && <line x1={START_X} y1={toY(start)} x2={END_X} y2={toY(end)} stroke={color} strokeWidth="3" strokeLinecap="round" />}
        <circle cx={START_X} cy={toY(start)} r="5" fill={color} />
        {choice ? (
          <circle cx={END_X} cy={toY(end)} r="7.5" fill={color} stroke="#fff" strokeWidth="2" />
        ) : (
          <g>
            <circle cx={END_X} cy={toY(start)} r="7" fill="none" stroke={color} strokeWidth="2" className="animate-pulse" />
            <text x={END_X - 12} y={toY(start) - 11} fill="rgba(255,255,255,0.7)" fontSize="9" textAnchor="end">drag up or down</text>
          </g>
        )}
      </svg>
      <div className="mt-1 grid grid-cols-3 gap-1.5">
        {Object.keys(PRESETS).map((id) => (
          <button
            key={id}
            type="button"
            data-choice={`${prediction.id}-${id}`}
            onClick={() => onChange(PRESETS[id])}
            className={cn(
              "rounded-lg border px-1.5 py-1 text-[11px] font-semibold capitalize transition",
              choice === id ? "border-white/50 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            {CHOICE_LABEL[id]}
          </button>
        ))}
      </div>
    </div>
  );
}
