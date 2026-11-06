import React, { useEffect, useState } from "react";
import { chloroRuntime } from "../../sim/chloroplast";
import { useLabStore } from "../../sim/labStore";

export const SERIES = [
  { key: "o2", label: "O₂ release", color: "#f87171" },
  { key: "s", label: "S release", color: "#facc15", sulfurOnly: true },
  { key: "atp", label: "ATP", color: "#fbbf24", dash: "4 3" },
  { key: "nadph", label: "NADPH", color: "#22d3ee", dash: "4 3" },
  { key: "sugar", label: "Sugar", color: "#c084fc" },
];

const W = 230;
const H = 58;
const WINDOW_S = 12;

export function seriesFor(sulfur) {
  return SERIES.filter((s) => (sulfur ? s.key !== "o2" : !s.sulfurOnly));
}

export function pathFor(points, key, t0, t1, w = W, h = H) {
  return points
    .map((p, i) => `${i ? "L" : "M"}${(((p.t - t0) / (t1 - t0)) * w).toFixed(1)},${(h - (p[key] / 100) * h).toFixed(1)}`)
    .join(" ");
}

export default function ChloroReadout() {
  const [, setTick] = useState(0);
  const sulfur = useLabStore((s) => s.chloroInputs.hSource === "H2S");
  const pending = useLabStore((s) => s.chloroPending);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, []);

  const t1 = Math.max(chloroRuntime.t, WINDOW_S);
  const t0 = t1 - WINDOW_S;
  const points = chloroRuntime.history.filter((p) => p.t >= t0);
  const out = chloroRuntime.out;
  const list = seriesFor(sulfur);
  const markX = pending ? ((pending.t0 - t0) / WINDOW_S) * W : null;

  return (
    <div className="flex items-center gap-3" data-testid="chloro-readout">
      <div className="relative">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
          <span>Chloroplast readout</span>
          <span className="normal-case tracking-normal text-white/35">last {WINDOW_S} s</span>
        </div>
        <svg width={W} height={H} className="overflow-visible rounded-md bg-white/[0.04]">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="rgba(255,255,255,0.06)" />
          ))}
          {markX !== null && markX >= 0 && (
            <g>
              <line x1={markX} x2={markX} y1={0} y2={H} stroke="rgba(255,255,255,0.5)" strokeDasharray="2 3" />
              <text x={markX + 3} y={9} fontSize={8} fill="rgba(255,255,255,0.7)">
                change
              </text>
            </g>
          )}
          {list.map((s) => (
            <path key={s.key} d={pathFor(points, s.key, t0, t1)} fill="none" stroke={s.color} strokeWidth={1.8} strokeDasharray={s.dash} strokeLinejoin="round" />
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {list.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-[11px] text-white/70">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            <span className="w-[62px] truncate">{s.label}</span>
            <span className="w-7 text-right font-mono font-bold tabular-nums text-white">{Math.round(out[s.key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
