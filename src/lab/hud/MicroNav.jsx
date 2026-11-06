import React from "react";
import { ChevronRight, Sprout } from "lucide-react";
import chapter from "../../data/chapter10_2.json";
import { useLabStore } from "../../sim/labStore";
import { cn } from "../ui";

const LEVELS = chapter.zoom.levels;
const BAR_WIDTH = [70, 64, 76, 0];

export default function MicroNav() {
  const level = useLabStore((s) => s.zoomLevel);
  const maxLevel = useLabStore((s) => s.maxZoomLevel);
  const canNavigate = useLabStore((s) => s.stage === "zoom" && s.co2Path.done);
  const zoomTo = useLabStore((s) => s.zoomTo);
  const current = LEVELS[level];

  return (
    <div className="pointer-events-auto flex flex-col items-start gap-2">
      <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/65 p-1 text-[11px] font-semibold backdrop-blur-xl" aria-label="Zoom level">
        <span className="flex items-center gap-1 px-2 text-white/45">
          <Sprout size={12} /> Plant
        </span>
        {LEVELS.map((l, i) => {
          const reachable = canNavigate && i <= maxLevel && i !== level;
          return (
            <React.Fragment key={l.id}>
              <ChevronRight size={12} className="text-white/25" />
              <button
                type="button"
                disabled={!reachable}
                onClick={() => zoomTo(i)}
                className={cn(
                  "rounded-full px-2.5 py-1 transition",
                  i === level ? "bg-emerald-400 text-slate-950" : reachable ? "text-white/80 hover:bg-white/10" : "text-white/30"
                )}
              >
                {l.crumb}
              </button>
            </React.Fragment>
          );
        })}
      </nav>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 text-[11px] text-white/70 backdrop-blur">
        {BAR_WIDTH[level] > 0 && (
          <span className="relative inline-block h-2" style={{ width: BAR_WIDTH[level] }}>
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-white" />
            <span className="absolute left-0 top-0 h-2 w-0.5 bg-white" />
            <span className="absolute right-0 top-0 h-2 w-0.5 bg-white" />
          </span>
        )}
        <span className="font-mono font-semibold text-white">{current.scale}</span>
        <span className="text-white/40">· {current.source}</span>
      </div>
    </div>
  );
}
