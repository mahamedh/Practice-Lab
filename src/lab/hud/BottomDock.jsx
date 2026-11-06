import React from "react";
import { BookOpen, Droplets, Lock, RotateCcw, Sun, Wind } from "lucide-react";
import scenarios from "../../data/scenarios.json";
import { useLabStore } from "../../sim/labStore";
import ActivityGauge from "./ActivityGauge";
import { cn, GhostButton, IconButton, Panel } from "../ui";

export const TOOL_ICONS = { light: Sun, water: Droplets, co2: Wind };
const TOOL_COLORS = {
  light: "from-amber-300 to-yellow-200 text-slate-950",
  water: "from-sky-400 to-cyan-300 text-slate-950",
  co2: "from-slate-300 to-slate-100 text-slate-950",
};
const TRACK = { light: "accent-amber-300", water: "accent-sky-400", co2: "accent-slate-200" };

function ToolButton({ variable, selected, locked }) {
  const value = useLabStore((s) => s.inputs[variable]);
  const focusTool = useLabStore((s) => s.focusTool);
  const Icon = TOOL_ICONS[variable];
  return (
    <button
      type="button"
      disabled={locked}
      title={`Focus the camera on ${scenarios.variables[variable].noun} (click again for overview)`}
      onClick={() => focusTool(variable)}
      className={cn(
        "group flex w-[86px] flex-col items-center gap-1 rounded-xl border px-2 py-2 transition disabled:cursor-not-allowed disabled:opacity-40",
        selected ? "border-white/40 bg-white/15" : "border-white/10 bg-white/5 hover:bg-white/10"
      )}
    >
      <span className={cn("grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br", TOOL_COLORS[variable])}>
        <Icon size={17} />
      </span>
      <span className="text-[11px] font-semibold text-white/80">{scenarios.variables[variable].label}</span>
      <span className="font-mono text-sm font-bold tabular-nums text-white">{value}</span>
    </button>
  );
}

function SelectedControl({ variable, locked }) {
  const value = useLabStore((s) => s.inputs[variable]);
  const setInput = useLabStore((s) => s.setInput);
  const commitChanges = useLabStore((s) => s.commitChanges);
  const meta = scenarios.variables[variable];
  const Icon = TOOL_ICONS[variable];
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span className="flex items-center gap-1.5 font-semibold text-white/85">
          <Icon size={14} /> {meta.label}
        </span>
        <span className="font-mono text-base font-bold tabular-nums text-white">{value}</span>
      </div>
      <input
        type="range"
        min={meta.min}
        max={meta.max}
        step={meta.step}
        value={value}
        disabled={locked}
        aria-label={`${meta.label} level`}
        onChange={(e) => setInput(variable, Number(e.target.value))}
        onPointerUp={commitChanges}
        onKeyUp={commitChanges}
        onBlur={commitChanges}
        className={cn("mt-2 w-full cursor-pointer disabled:cursor-not-allowed", TRACK[variable])}
      />
      <div className="mt-1 text-[11px] text-white/45">{locked ? "Controls unlock in the experiment" : `${meta.dragHint} in the scene, or use this slider.`}</div>
    </div>
  );
}

export default function BottomDock() {
  const stage = useLabStore((s) => s.stage);
  const selectedTool = useLabStore((s) => s.selectedTool);
  const scenarioId = useLabStore((s) => s.scenarioId);
  const hasTrial = useLabStore((s) => s.trials.some((t) => t.scenarioId === s.scenarioId));
  const trialCount = useLabStore((s) => s.trials.length);
  const resetScenario = useLabStore((s) => s.resetScenario);
  const toggleNotebook = useLabStore((s) => s.toggleNotebook);
  const locked = stage !== "experiment" && stage !== "apply";
  const tool = selectedTool || "light";

  return (
    <Panel className="mx-auto flex w-full max-w-[1180px] items-center gap-5 px-4 py-3">
      <div className="flex items-center gap-2">
        {Object.keys(scenarios.variables).map((key) => (
          <ToolButton key={key} variable={key} selected={!locked && selectedTool === key} locked={locked} />
        ))}
      </div>

      <div className="h-14 w-px bg-white/10" />

      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        {locked ? (
          <div className="flex items-center gap-2 text-sm text-white/55">
            <Lock size={15} /> Controls unlock in the experiment.
          </div>
        ) : (
          <SelectedControl variable={tool} locked={locked} />
        )}
      </div>

      <div className="h-14 w-px bg-white/10" />

      <ActivityGauge showLimiting={hasTrial || stage === "explain"} key={scenarioId} />

      <div className="flex items-center gap-2">
        <IconButton label="Reset this greenhouse (R)" onClick={resetScenario} className={locked ? "opacity-40" : ""} disabled={locked}>
          <RotateCcw size={16} />
        </IconButton>
        <GhostButton onClick={() => toggleNotebook()} className="px-3">
          <BookOpen size={15} />
          <span className="tabular-nums">{trialCount}</span>
        </GhostButton>
      </div>
    </Panel>
  );
}
