import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, FlaskConical, RotateCcw } from "lucide-react";
import scenarios from "../../data/scenarios.json";
import guide from "../../data/guide.json";
import { useLabStore } from "../../sim/labStore";
import { getApplyFlags, getExperimentFlags } from "../../sim/mastery";
import { Eyebrow, GhostButton, Panel } from "../ui";

export function MiniSketch({ start, end, className = "" }) {
  const y = (v) => 40 - (v / 100) * 34;
  return (
    <svg viewBox="0 0 80 44" className={className}>
      <line x1="4" y1="42" x2="78" y2="42" stroke="rgba(255,255,255,0.2)" />
      <line x1="4" y1="42" x2="4" y2="2" stroke="rgba(255,255,255,0.2)" />
      <line x1="12" y1={y(start)} x2="70" y2={y(end)} stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3" />
      <circle cx="12" cy={y(start)} r="3" fill="#fcd34d" />
      <circle cx="70" cy={y(end)} r="3.5" fill="#fcd34d" />
    </svg>
  );
}

function predictionLabel(choice) {
  return scenarios.predict.options.find((o) => o.id === choice)?.label || "";
}

function Hypothesis() {
  const hypothesis = useLabStore((s) => s.hypothesis);
  if (!hypothesis) return null;
  return (
    <Panel className="flex items-center gap-3 p-3">
      <MiniSketch start={scenarios.scenarios.A.initial.light} end={hypothesis.end} className="h-11 w-20 shrink-0" />
      <div>
        <Eyebrow className="text-amber-200/80">Your hypothesis</Eyebrow>
        <div className="text-sm font-semibold">Photosynthesis {predictionLabel(hypothesis.choice).replace(/^It /, "").toLowerCase()} with more sunlight.</div>
      </div>
    </Panel>
  );
}

function Comparison() {
  const hypothesis = useLabStore((s) => s.hypothesis);
  const trials = useLabStore((s) => s.trials);
  const resetScenario = useLabStore((s) => s.resetScenario);
  const { limitingTrial } = getExperimentFlags(trials);
  if (!limitingTrial || !hypothesis) return null;
  const supported = hypothesis.choice === scenarios.predict.correct;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Panel className="space-y-2.5 p-4 text-sm">
        <div className="flex items-center gap-2 font-bold">
          <FlaskConical size={16} className="text-emerald-300" /> Prediction vs. evidence
        </div>
        <div>
          <Eyebrow className="text-white/45">Your prediction</Eyebrow>
          <div>{predictionLabel(hypothesis.choice)}.</div>
        </div>
        <div>
          <Eyebrow className="text-white/45">What the simulation showed</Eyebrow>
          <div>
            Light {limitingTrial.from} → {limitingTrial.to}, activity {limitingTrial.activityBefore} → {limitingTrial.activityAfter}. {guide.comparison.observed}
          </div>
        </div>
        <div className={supported ? "rounded-xl bg-emerald-400/10 p-2.5 text-emerald-100" : "rounded-xl bg-amber-300/10 p-2.5 text-amber-50"}>
          {supported ? guide.comparison.supported : guide.comparison.different}
        </div>
        {!supported && (
          <GhostButton onClick={resetScenario} className="w-full py-1.5 text-xs">
            <RotateCcw size={13} /> Run the experiment again
          </GhostButton>
        )}
      </Panel>
    </motion.div>
  );
}

function MisconceptionNotice() {
  const status = useLabStore((s) => s.misconceptionStatus);
  const wrongTrial = useLabStore((s) => getApplyFlags(s).wrongTrial);
  const entry = Object.entries(status).find(([, v]) => v === "detected");
  if (!entry || !wrongTrial) return null;
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Panel className="border-amber-300/30 p-4 text-sm">
        <div className="mb-1.5 flex items-center gap-2 font-bold text-amber-200">
          <AlertTriangle size={16} /> More light did not help
        </div>
        <p className="text-white/80">
          Light {wrongTrial.from} → {wrongTrial.to}, but activity stayed at {wrongTrial.activityAfter}. What is this plant really missing?
        </p>
      </Panel>
    </motion.div>
  );
}

export default function HypothesisColumn() {
  const stage = useLabStore((s) => s.stage);
  const solved = useLabStore((s) => getApplyFlags(s).solved);
  if (stage === "experiment") {
    return (
      <div className="flex w-[320px] flex-col gap-3">
        <Hypothesis />
        <Comparison />
      </div>
    );
  }
  if (stage === "apply" && !solved) {
    return (
      <div className="flex w-[320px] flex-col gap-3">
        <MisconceptionNotice />
      </div>
    );
  }
  return null;
}
