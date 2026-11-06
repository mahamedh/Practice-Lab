import React from "react";
import { Check, Leaf, Maximize2, Minimize2, X } from "lucide-react";
import scenarios from "../../data/scenarios.json";
import chapter from "../../data/chapter10_2.json";
import labsheet from "../../data/labsheet.json";
import { STAGES, useLabStore } from "../../sim/labStore";
import { exitFullscreen, toggleFullscreen, useIsFullscreen } from "../fullscreen";
import { cn, IconButton } from "../ui";

const STEPS = [
  { key: "predict", label: "Predict" },
  { key: "experiment", label: "Experiment" },
  { key: "zoom", label: "Inside the leaf" },
  { key: "explain", label: "Explain" },
  { key: "apply", label: "Apply" },
  { key: "challenge", label: "Challenge" },
  { key: "report", label: "Report" },
];
const ORDER = STAGES;

function useSubtitle() {
  return useLabStore((s) => {
    if (s.stage === "zoom") {
      const level = chapter.zoom.levels[s.zoomLevel];
      return `${level.name} · ${level.source}`;
    }
    if (s.stage === "challenge") return chapter.challenge.cases[s.challenge.index].title;
    if (s.stage === "report") return labsheet.course;
    return scenarios.scenarios[s.scenarioId].name;
  });
}

export default function TopBar() {
  const stage = useLabStore((s) => s.stage);
  const subtitle = useSubtitle();
  const closeLab = useLabStore((s) => s.closeLab);
  const isFullscreen = useIsFullscreen();
  const current = ORDER.indexOf(stage);

  return (
    <div className="pointer-events-none flex items-center justify-between gap-4 px-5 pt-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/60 py-1.5 pl-1.5 pr-4 backdrop-blur-xl">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-300 text-slate-950">
          <Leaf size={17} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">{scenarios.mission.title}</div>
          <div className="max-w-[260px] truncate text-[11px] text-white/60">{subtitle}</div>
        </div>
      </div>

      <div className="pointer-events-auto hidden items-center gap-1 rounded-full border border-white/10 bg-slate-950/60 p-1 backdrop-blur-xl lg:flex">
        {STEPS.map((step, i) => {
          const index = ORDER.indexOf(step.key);
          const done = current > index;
          const active = current === index;
          return (
            <React.Fragment key={step.key}>
              {i > 0 && <div className={cn("h-px w-3 xl:w-4", done || active ? "bg-emerald-400/70" : "bg-white/15")} />}
              <div
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold transition",
                  active && "bg-emerald-400 text-slate-950",
                  done && "text-emerald-300",
                  !active && !done && "text-white/45"
                )}
              >
                {done ? <Check size={13} strokeWidth={3} /> : <span className="tabular-nums">{i + 1}</span>}
                {step.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <IconButton label={isFullscreen ? "Exit full screen (F)" : "Full screen (F)"} onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </IconButton>
        <IconButton
          label="Close lab"
          onClick={() => {
            exitFullscreen();
            closeLab();
          }}
        >
          <X size={17} />
        </IconButton>
      </div>
    </div>
  );
}
