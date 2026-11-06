import React, { useState } from "react";
import { ArrowRight, Check, Microscope, Lock } from "lucide-react";
import chapter from "../../data/chapter10_2.json";
import { useLabStore } from "../../sim/labStore";
import { couplingTests, getZoomTask } from "../../sim/advancedSlice";
import StagePanel from "./StagePanel";
import WhatIfSketch, { CHOICE_LABEL, classifyLine } from "./WhatIfSketch";
import { HypothesisTask, IsotopeTask, LedgerTask } from "./IsotopePanel";
import { pathFor } from "../hud/ChloroReadout";
import { cn, GhostButton, PrimaryButton } from "../ui";

const Z = chapter.zoom;
const P = chapter.co2Path;
const WI = chapter.whatIf;

function Co2PathTask() {
  const path = useLabStore((s) => s.co2Path);
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">Concept Check 10.2 · 1 · Make connections</div>
        <div className="mt-1 text-[15px] font-semibold leading-snug">{chapter.conceptCheck[0].text}</div>
      </div>
      <p className="text-sm text-white/65">{P.instruction}</p>
      <ol className="space-y-1.5">
        {P.order.map((id, i) => {
          const done = path.picked.includes(id);
          const next = i === path.picked.length;
          return (
            <li
              key={id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm",
                done ? "bg-emerald-400/10 text-emerald-50" : next ? "bg-white/10 text-white" : "bg-white/[0.03] text-white/35"
              )}
            >
              <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold", done ? "bg-emerald-400 text-slate-950" : "bg-white/10")}>
                {done ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span>{done ? P.steps[id] : next ? "Click the next structure in the scene…" : "?"}</span>
            </li>
          );
        })}
      </ol>
      {path.wrong && !path.done && (
        <div key={path.wrong.nonce} className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-50">
          That was the {Z.structures[path.wrong.id].toLowerCase()}. {path.wrong.hint}
        </div>
      )}
      {path.done && <div className="rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-50">{P.done}</div>}
    </div>
  );
}

function LevelTask() {
  const level = useLabStore((s) => s.zoomLevel);
  const zoomTo = useLabStore((s) => s.zoomTo);
  const l = Z.levels[level];
  return (
    <div className="mt-3 space-y-3">
      <h2 className="text-xl font-bold leading-snug">{l.name}</h2>
      <ul className="space-y-2">
        {l.facts.map((f) => (
          <li key={f} className="flex gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
            {f}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[12px] text-white/60">
        <span>Scale</span>
        <span className="font-mono font-semibold text-white">{l.scale}</span>
      </div>
      {l.hotspot && (
        <PrimaryButton onClick={() => zoomTo(level + 1)} className="w-full">
          {l.hotspot} <ArrowRight size={15} />
        </PrimaryButton>
      )}
    </div>
  );
}

function WhatIfTask() {
  const confirmWhatIf = useLabStore((s) => s.confirmWhatIf);
  const [ends, setEnds] = useState({});
  const ready = WI.predictions.every((p) => ends[p.id] !== undefined);
  const colors = { o2NoCo2: "#f87171", sugarDark: "#c084fc" };
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200/80">Concept Check 10.2 · 3 · What if?</div>
        <div className="mt-1 text-[14px] leading-snug text-white/85">{WI.intro}</div>
      </div>
      <p className="text-[12px] text-white/55">{WI.instruction}</p>
      {WI.predictions.map((p) => (
        <WhatIfSketch key={p.id} prediction={p} end={ends[p.id]} color={colors[p.id]} onChange={(v) => setEnds((e) => ({ ...e, [p.id]: v }))} />
      ))}
      <PrimaryButton
        disabled={!ready}
        className="w-full py-3"
        onClick={() =>
          confirmWhatIf(Object.fromEntries(WI.predictions.map((p) => [p.id, { choice: classifyLine(p.start, ends[p.id]), end: ends[p.id] }])))
        }
      >
        <Lock size={15} /> {WI.confirm}
      </PrimaryButton>
    </div>
  );
}

function TrialSpark({ trial, keys }) {
  const colors = { o2: "#f87171", atp: "#fbbf24", nadph: "#22d3ee", sugar: "#c084fc" };
  const pts = trial.series;
  if (!pts?.length) return null;
  const t0 = pts[0].t;
  const t1 = pts[pts.length - 1].t || 1;
  return (
    <svg width={120} height={34} className="shrink-0 rounded bg-white/[0.04]">
      {keys.map((k) => (
        <path key={k} d={pathFor(pts, k, t0, t1, 120, 34)} fill="none" stroke={colors[k]} strokeWidth={1.6} />
      ))}
    </svg>
  );
}

function CouplingTask() {
  const whatIf = useLabStore((s) => s.whatIf);
  const trials = useLabStore((s) => s.chloroTrials);
  const pending = useLabStore((s) => s.chloroPending);
  const toggleChloro = useLabStore((s) => s.toggleChloro);
  const selectMicroTool = useLabStore((s) => s.selectMicroTool);
  const inputs = useLabStore((s) => s.chloroInputs);
  const tests = couplingTests(trials);
  const rows = [
    { test: WI.tests[0], trial: tests.co2Off, pred: WI.predictions[0], value: "o2", keys: ["o2", "atp", "sugar"], variable: "co2" },
    { test: WI.tests[1], trial: tests.lightOff, pred: WI.predictions[1], value: "sugar", keys: ["sugar", "atp", "o2"], variable: "light" },
  ];
  return (
    <div className="mt-3 space-y-3">
      <h2 className="text-xl font-bold leading-snug">Test both predictions</h2>
      <p className="text-sm text-white/65">Change one supply at a time and watch the readout. Restore it before the next test.</p>
      {rows.map(({ test, trial, pred, value, keys, variable }) => {
        const choice = whatIf?.[pred.id]?.choice;
        const actual = trial ? classifyLine(trial.before[value], trial.after[value]) : null;
        const isPending = pending?.variable === variable;
        const otherOff = variable === "co2" ? inputs.light <= 10 : inputs.co2 <= 10;
        return (
          <div key={test.id} className={cn("rounded-xl border p-3", trial ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/5")}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold">{test.label}</div>
              {trial && <Check size={16} className="text-emerald-300" strokeWidth={3} />}
            </div>
            <div className="mt-1 text-[12px] text-white/55">
              You predicted {pred.series.split(" (")[0].toLowerCase()} would <span className="font-semibold text-white">{CHOICE_LABEL[choice]}</span>.
            </div>
            {trial ? (
              <div className="mt-2 flex items-center gap-3">
                <TrialSpark trial={trial} keys={keys} />
                <div className="text-[12px]">
                  <div className="font-mono text-white/85">
                    {value === "o2" ? "O₂" : "Sugar"} {trial.before[value]} → {trial.after[value]}
                  </div>
                  <div className={actual === choice ? "text-emerald-300" : "text-amber-200"}>
                    {actual === choice ? "Prediction supported" : "Different from your prediction"}
                  </div>
                </div>
              </div>
            ) : isPending ? (
              <div className="mt-2 text-[12px] text-emerald-200">Watching the chloroplast respond…</div>
            ) : (
              <GhostButton
                className="mt-2 w-full py-1.5 text-[12px]"
                disabled={otherOff}
                onClick={() => {
                  selectMicroTool(variable);
                  toggleChloro(variable);
                }}
              >
                {otherOff ? "Restore the other supply first" : `Run it: ${variable === "co2" ? "remove CO₂" : "switch the light off"}`}
              </GhostButton>
            )}
            {trial && <div className="mt-1.5 text-[12px] text-white/70">{WI.verdict[pred.id]}</div>}
          </div>
        );
      })}
      {(inputs.light <= 10 || inputs.co2 <= 10) && !pending && (
        <GhostButton className="w-full py-1.5 text-[12px]" onClick={() => toggleChloro(inputs.light <= 10 ? "light" : "co2")}>
          Restore {inputs.light <= 10 ? "the light" : "CO₂"}
        </GhostButton>
      )}
    </div>
  );
}

function ReadyTask() {
  const goToStage = useLabStore((s) => s.goToStage);
  return (
    <div className="mt-3 space-y-3">
      <h2 className="text-xl font-bold leading-snug">Inside the leaf: complete</h2>
      <ul className="space-y-1.5 text-sm text-white/80">
        {["Traced CO₂ from the stoma into a chloroplast", "Showed the light reactions and Calvin cycle depend on each other", "Showed with ¹⁸O that O₂ comes from water", "Tracked every atom of the equation"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check size={15} className="text-emerald-300" strokeWidth={3} /> {t}
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-white/55">Try the Redox and Atom origin views in the equation strip, or keep experimenting before you explain.</p>
      <PrimaryButton onClick={() => goToStage("explain")} className="w-full">
        Explain my evidence <ArrowRight size={15} />
      </PrimaryButton>
    </div>
  );
}

const TASKS = {
  co2path: { eyebrow: "Inside the leaf · CO₂ path", source: "Figure 10.3", body: Co2PathTask },
  leaf: { eyebrow: "Inside the leaf · Leaf", source: "Figure 10.3", body: LevelTask },
  cell: { eyebrow: "Inside the leaf · Cell", source: "Figure 10.3", body: LevelTask },
  chloroplast: { eyebrow: "Inside the leaf · Chloroplast", source: "Figure 10.3", body: LevelTask },
  whatIf: { eyebrow: "Two stages · Predict", source: "Figure 10.5", body: WhatIfTask },
  coupling: { eyebrow: "Two stages · Test", source: "Figure 10.5", body: CouplingTask },
  hypothesis: { eyebrow: "Tracking atoms · Hypothesis", source: "Scientific inquiry", body: HypothesisTask },
  isotope: { eyebrow: "Tracking atoms · ¹⁸O", source: "Scientific inquiry", body: IsotopeTask },
  ledger: { eyebrow: "Tracking atoms · Ledger", source: "Figure 10.4", body: LedgerTask },
  ready: { eyebrow: "Inside the leaf", source: "Concept 10.2", body: ReadyTask },
};

export default function ZoomPanel() {
  const task = useLabStore(getZoomTask);
  const { eyebrow, source, body: Body } = TASKS[task];
  return (
    <StagePanel icon={Microscope} eyebrow={eyebrow} source={source} panelKey={task}>
      <Body />
    </StagePanel>
  );
}
