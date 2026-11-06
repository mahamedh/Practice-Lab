import React from "react";
import { BookOpen, Lock, Power, Sun, Wind } from "lucide-react";
import chapter from "../../data/chapter10_2.json";
import { useLabStore } from "../../sim/labStore";
import { canAdjustChloro, getZoomTask } from "../../sim/advancedSlice";
import ChloroReadout from "./ChloroReadout";
import { cn, GhostButton, Panel } from "../ui";

const TOOLS = {
  light: { label: "Light", icon: Sun, color: "from-amber-300 to-yellow-200 text-slate-950", track: "accent-amber-300" },
  co2: { label: "CO₂", icon: Wind, color: "from-slate-300 to-slate-100 text-slate-950", track: "accent-slate-200" },
};

function lockReason(s) {
  if (s.stage === "challenge") return "Conditions are fixed. Diagnose from the readouts.";
  if (s.zoomLevel < 3) return "Controls unlock in the two-stage view.";
  if (getZoomTask(s) === "whatIf") return "Make your WHAT IF prediction first.";
  return null;
}

function ToolButton({ variable, selected, locked }) {
  const value = useLabStore((s) => s.chloroInputs[variable]);
  const select = useLabStore((s) => s.selectMicroTool);
  const meta = TOOLS[variable];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => select(variable)}
      className={cn(
        "flex w-[78px] flex-col items-center gap-1 rounded-xl border px-2 py-2 transition disabled:cursor-not-allowed disabled:opacity-40",
        selected ? "border-white/40 bg-white/15" : "border-white/10 bg-white/5 hover:bg-white/10"
      )}
    >
      <span className={cn("grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br", meta.color)}>
        <Icon size={17} />
      </span>
      <span className="text-[11px] font-semibold text-white/80">{meta.label}</span>
      <span className="font-mono text-sm font-bold tabular-nums text-white">{value}</span>
    </button>
  );
}

function Control({ variable }) {
  const value = useLabStore((s) => s.chloroInputs[variable]);
  const setChloroInput = useLabStore((s) => s.setChloroInput);
  const commitChloro = useLabStore((s) => s.commitChloro);
  const toggleChloro = useLabStore((s) => s.toggleChloro);
  const meta = TOOLS[variable];
  const Icon = meta.icon;
  const off = value <= 10;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span className="flex items-center gap-1.5 font-semibold text-white/85">
          <Icon size={14} /> {meta.label} supply
        </span>
        <button
          type="button"
          onClick={() => toggleChloro(variable)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition",
            off ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300" : "bg-rose-500/90 text-white hover:bg-rose-400"
          )}
        >
          <Power size={12} /> {off ? `Restore ${meta.label}` : variable === "co2" ? "Remove CO₂" : "Switch light off"}
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        aria-label={`${meta.label} supply to the chloroplast`}
        onChange={(e) => setChloroInput(variable, Number(e.target.value))}
        onPointerUp={commitChloro}
        onKeyUp={commitChloro}
        onBlur={commitChloro}
        className={cn("mt-2 w-full cursor-pointer", meta.track)}
      />
      <div className="mt-1 text-[11px] text-white/45">Change one supply, then watch the readout for about 4 seconds.</div>
    </div>
  );
}

function LevelFacts() {
  const level = useLabStore((s) => chapter.zoom.levels[s.zoomLevel]);
  return (
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">{level.source}</div>
      <ul className="mt-1 space-y-0.5 text-[12px] text-white/75">
        {level.facts.map((f) => (
          <li key={f} className="truncate">
            · {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MicroDock() {
  const level = useLabStore((s) => s.zoomLevel);
  const tool = useLabStore((s) => s.microTool);
  const adjustable = useLabStore(canAdjustChloro);
  const reason = useLabStore(lockReason);
  const hSource = useLabStore((s) => s.chloroInputs.hSource);
  const trialCount = useLabStore((s) => s.trials.length + s.chloroTrials.length);
  const toggleNotebook = useLabStore((s) => s.toggleNotebook);

  return (
    <Panel className="mx-auto flex w-full max-w-[1180px] items-center gap-5 px-4 py-3">
      <div className="flex items-center gap-2">
        {Object.keys(TOOLS).map((key) => (
          <ToolButton key={key} variable={key} selected={adjustable && tool === key} locked={!adjustable} />
        ))}
        <div className="flex w-[78px] flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-2">
          <span className={cn("grid h-8 w-8 place-items-center rounded-full text-[11px] font-black", hSource === "H2S" ? "bg-yellow-300 text-yellow-950" : "bg-sky-400 text-sky-950")}>
            H
          </span>
          <span className="text-[11px] font-semibold text-white/80">H source</span>
          <span className="font-mono text-sm font-bold text-white">{hSource === "H2S" ? "H₂S" : "H₂O"}</span>
        </div>
      </div>

      <div className="h-14 w-px bg-white/10" />

      <div className="flex min-w-[220px] flex-1 items-center gap-3">
        {level < 3 ? (
          <LevelFacts />
        ) : adjustable ? (
          <Control variable={tool} key={tool} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-white/55">
            <Lock size={15} /> {reason}
          </div>
        )}
      </div>

      {level === 3 && (
        <>
          <div className="h-14 w-px bg-white/10" />
          <ChloroReadout />
        </>
      )}

      <GhostButton onClick={() => toggleNotebook()} className="px-3">
        <BookOpen size={15} />
        <span className="tabular-nums">{trialCount}</span>
      </GhostButton>
    </Panel>
  );
}
