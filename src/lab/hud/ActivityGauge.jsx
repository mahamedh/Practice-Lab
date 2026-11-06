import React, { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { describeLimiting, useLabStore } from "../../sim/labStore";
import { cn } from "../ui";

const SAMPLES = 60;

function useAnimatedNumber(value) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const controls = animate(prev.current, value, { duration: 0.6, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return shown;
}

function useHistory() {
  const [history, setHistory] = useState(() => Array(SAMPLES).fill(useLabStore.getState().activity));
  useEffect(() => {
    const id = setInterval(() => setHistory((h) => [...h.slice(1), useLabStore.getState().activity]), 250);
    return () => clearInterval(id);
  }, []);
  return history;
}

function tone(value) {
  if (value >= 60) return { text: "text-emerald-300", stroke: "#34d399" };
  if (value >= 35) return { text: "text-amber-200", stroke: "#fcd34d" };
  return { text: "text-rose-300", stroke: "#fb7185" };
}

export default function ActivityGauge({ showLimiting }) {
  const activity = useLabStore((s) => s.activity);
  const limiting = useLabStore((s) => s.limiting);
  const shown = useAnimatedNumber(activity);
  const history = useHistory();
  const trend = history[SAMPLES - 1] - history[SAMPLES - 9];
  const t = tone(activity);

  const r = 34;
  const arc = Math.PI * r;
  const points = history.map((v, i) => `${(i / (SAMPLES - 1)) * 120},${42 - (v / 100) * 38}`).join(" ");

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[52px] w-[84px] shrink-0">
        <svg viewBox="0 0 84 48" className="absolute inset-0 h-full w-full overflow-visible">
          <path d={`M 8 44 A ${r} ${r} 0 0 1 76 44`} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" strokeLinecap="round" />
          <motion.path
            d={`M 8 44 A ${r} ${r} 0 0 1 76 44`}
            fill="none"
            stroke={t.stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={arc}
            initial={{ strokeDashoffset: arc }}
            animate={{ strokeDashoffset: arc * (1 - activity / 100), stroke: t.stroke }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </svg>
        <div className={cn("absolute inset-x-0 bottom-0 text-center font-mono text-2xl font-bold tabular-nums leading-none", t.text)}>{shown}</div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
          Photosynthesis activity
          {Math.abs(trend) >= 2 &&
            (trend > 0 ? <TrendingUp size={14} className="text-emerald-300" /> : <TrendingDown size={14} className="text-rose-300" />)}
        </div>
        <svg viewBox="0 0 120 44" preserveAspectRatio="none" className="mt-1 h-9 w-32 rounded-md bg-white/5">
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" x2="120" y1={42 - (y / 100) * 38} y2={42 - (y / 100) * 38} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
          ))}
          <polyline points={points} fill="none" stroke={t.stroke} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-1 h-4 text-[11px] text-white/60">
          {showLimiting && limiting.length > 0 && (
            <span>
              Limited by <b className="text-rose-200">{describeLimiting(limiting)}</b>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
