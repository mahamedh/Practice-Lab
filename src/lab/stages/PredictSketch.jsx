import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Brain, Lock } from "lucide-react";
import scenarios from "../../data/scenarios.json";
import { useLabStore } from "../../sim/labStore";
import { cn, Eyebrow, Panel, PrimaryButton } from "../ui";

const W = 340;
const H = 210;
const PLOT = { left: 44, right: 316, top: 18, bottom: 172 };
const START_X = 84;
const END_X = 286;
const PRESETS = { increase: 72, same: 20, decrease: 4 };

const toY = (v) => PLOT.bottom - (v / 100) * (PLOT.bottom - PLOT.top);
const toValue = (y) => Math.max(0, Math.min(100, ((PLOT.bottom - y) / (PLOT.bottom - PLOT.top)) * 100));

function classify(start, end) {
  if (end - start > 8) return "increase";
  if (end - start < -6) return "decrease";
  return "same";
}

export default function PredictSketch() {
  const confirmPrediction = useLabStore((s) => s.confirmPrediction);
  const { predict } = scenarios;
  const start = scenarios.scenarios.A.initial.light;
  const [end, setEnd] = useState(null);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef();
  const choice = end === null ? null : classify(start, end);

  const updateFromEvent = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const y = ((e.clientY - rect.top) / rect.height) * H;
    setEnd(Math.round(toValue(y)));
  };

  return (
    <div className="pointer-events-none absolute inset-y-1 right-5 flex items-center">
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex max-h-full">
        <Panel className="max-h-full w-[400px] overflow-y-auto p-5">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-amber-200" />
            <Eyebrow className="text-amber-200/80">Step 1 · Predict</Eyebrow>
          </div>
          <p className="mt-3 text-sm text-white/70">{predict.context}</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">{predict.question}</h2>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-2">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className={cn("w-full touch-none", dragging ? "cursor-grabbing" : "cursor-ns-resize")}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setDragging(true);
                updateFromEvent(e);
              }}
              onPointerMove={(e) => dragging && updateFromEvent(e)}
              onPointerUp={() => setDragging(false)}
            >
              {[0, 25, 50, 75, 100].map((v) => (
                <line key={v} x1={PLOT.left} x2={PLOT.right} y1={toY(v)} y2={toY(v)} stroke="rgba(255,255,255,0.07)" />
              ))}
              <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} stroke="rgba(255,255,255,0.35)" />
              <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.left} y2={PLOT.top} stroke="rgba(255,255,255,0.35)" />
              <text x={14} y={(PLOT.top + PLOT.bottom) / 2} fill="rgba(255,255,255,0.55)" fontSize="11" transform={`rotate(-90 14 ${(PLOT.top + PLOT.bottom) / 2})`} textAnchor="middle">
                Photosynthesis activity
              </text>
              <text x={START_X} y={H - 16} fill="rgba(255,255,255,0.6)" fontSize="11" textAnchor="middle">Now</text>
              <text x={END_X} y={H - 16} fill="rgba(255,255,255,0.6)" fontSize="11" textAnchor="middle">More sunlight</text>
              <line x1={END_X} x2={END_X} y1={PLOT.top} y2={PLOT.bottom} stroke="rgba(252,211,77,0.25)" strokeDasharray="3 4" />

              {end !== null && (
                <line x1={START_X} y1={toY(start)} x2={END_X} y2={toY(end)} stroke="#fcd34d" strokeWidth="3.5" strokeLinecap="round" />
              )}
              <circle cx={START_X} cy={toY(start)} r="6" fill="#fcd34d" />
              {end === null ? (
                <g>
                  <circle cx={END_X} cy={toY(start)} r="10" fill="none" stroke="#fcd34d" strokeWidth="2" className="animate-ping" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
                  <circle cx={END_X} cy={toY(start)} r="8" fill="rgba(252,211,77,0.25)" stroke="#fcd34d" strokeWidth="2" />
                  <text x={END_X - 16} y={toY(start) - 16} fill="#fde68a" fontSize="11" textAnchor="end">drag up or down</text>
                </g>
              ) : (
                <circle cx={END_X} cy={toY(end)} r="9" fill="#fcd34d" stroke="#fff7d6" strokeWidth="2" />
              )}
            </svg>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
            <ArrowUpDown size={14} /> {predict.instruction}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {predict.options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setEnd(PRESETS[o.id])}
                className={cn(
                  "rounded-xl border px-2 py-2 text-xs font-semibold transition",
                  choice === o.id ? "border-amber-300 bg-amber-300/15 text-amber-100" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {o.short}
              </button>
            ))}
          </div>

          <PrimaryButton disabled={!choice} onClick={() => confirmPrediction(choice, end)} className="mt-4 w-full py-3">
            <Lock size={15} /> {predict.confirm}
          </PrimaryButton>
        </Panel>
      </motion.div>
    </div>
  );
}
