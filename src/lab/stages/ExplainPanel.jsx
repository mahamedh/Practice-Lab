import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquareText } from "lucide-react";
import rubric from "../../data/rubric.json";
import misconceptions from "../../data/misconceptions.json";
import { VAR_LABEL, explainQ1Done, explainQ2Done, useLabStore } from "../../sim/labStore";
import { couplingTests } from "../../sim/advancedSlice";
import { getExperimentFlags } from "../../sim/mastery";
import AnswerBox from "./AnswerBox";
import { cn, Eyebrow, GhostButton, Panel, PrimaryButton } from "../ui";

function EvidenceLine({ trial, note }) {
  if (!trial) return null;
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 font-mono text-xs">
      <span>
        {VAR_LABEL[trial.variable]} {trial.from} → {trial.to}
      </span>
      <span className={trial.activityAfter > trial.activityBefore ? "text-emerald-300" : "text-amber-200"}>
        activity {trial.activityBefore} → {trial.activityAfter} {note}
      </span>
    </div>
  );
}

function Line({ left, right, tone = "text-amber-200" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-1.5 font-mono text-xs">
      <span>{left}</span>
      <span className={tone}>{right}</span>
    </div>
  );
}

function Question1() {
  const trials = useLabStore((s) => s.trials);
  const attempts = useLabStore((s) => s.explainAttempts);
  const submitExplanation = useLabStore((s) => s.submitExplanation);
  const { limitingTrial, nonLimitingTrial } = getExperimentFlags(trials);
  const last = attempts[attempts.length - 1];
  const { explain } = rubric;
  return (
    <>
      <h2 className="mt-2 text-xl font-bold leading-snug">{explain.question}</h2>
      {(limitingTrial || nonLimitingTrial) && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Your greenhouse evidence</div>
          <EvidenceLine trial={limitingTrial} />
          <EvidenceLine trial={nonLimitingTrial} note="(no change)" />
        </div>
      )}
      <div className="mt-4">
        <AnswerBox placeholder={explain.placeholder} starters={explain.starters} ideas={explain.ideas} result={last} onSubmit={submitExplanation} />
      </div>
    </>
  );
}

function Question2() {
  const attempts = useLabStore((s) => s.explain2Attempts);
  const submit = useLabStore((s) => s.submitExplanation2);
  const chloroTrials = useLabStore((s) => s.chloroTrials);
  const runs = useLabStore((s) => s.atoms.runs);
  const status = useLabStore((s) => s.misconceptionStatus);
  const goToStage = useLabStore((s) => s.goToStage);
  const tests = couplingTests(chloroTrials);
  const last = attempts[attempts.length - 1];
  const q = rubric.explain2;
  const open = Object.entries(status).filter(([code, v]) => v === "detected" && misconceptions[code].clear?.idea);
  return (
    <>
      <h2 className="mt-2 text-xl font-bold leading-snug">{q.question}</h2>
      <div className="mt-3 space-y-1.5">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">Your chloroplast evidence</div>
        {runs.h2o18 && <Line left="¹⁸O in H₂O" right="label in released O₂" tone="text-emerald-300" />}
        {runs.co2_18 && <Line left="¹⁸O in CO₂" right="label in sugar + water, not O₂" />}
        {tests.co2Off && <Line left="CO₂ removed, light on" right={`O₂ ${tests.co2Off.before.o2} → ${tests.co2Off.after.o2}, ATP ${tests.co2Off.after.atp}%`} />}
        {tests.lightOff && <Line left="Light off, CO₂ present" right={`sugar ${tests.lightOff.before.sugar} → ${tests.lightOff.after.sugar}`} />}
      </div>
      {open.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-[12px] text-amber-50">
          Your earlier prediction suggested: <span className="font-semibold">“{misconceptions[open[0][0]].label}”</span>. Address it in your answer.
        </div>
      )}
      <div className="mt-4">
        <AnswerBox
          key="q2"
          placeholder={q.placeholder}
          starters={q.starters}
          ideas={q.ideas}
          result={last}
          onSubmit={submit}
          passAction={
            <PrimaryButton onClick={() => goToStage("apply")} className="flex-1">
              Apply it to a new plant <ArrowRight size={15} />
            </PrimaryButton>
          }
        />
      </div>
    </>
  );
}

export default function ExplainPanel() {
  const q1Done = useLabStore(explainQ1Done);
  const q2Done = useLabStore(explainQ2Done);
  const q1Passed = useLabStore((s) => Boolean(s.explainAttempts[s.explainAttempts.length - 1]?.result.requiredMet));
  const q2Passed = useLabStore((s) => Boolean(s.explain2Attempts[s.explain2Attempts.length - 1]?.result.requiredMet));
  const goToStage = useLabStore((s) => s.goToStage);
  const [current, setTab] = useState(() => (explainQ1Done(useLabStore.getState()) ? 2 : 1));

  return (
    <div className="pointer-events-none absolute inset-y-1 right-5 flex items-center">
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex max-h-full">
        <Panel className="max-h-full w-[440px] overflow-y-auto p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquareText size={18} className="text-sky-300" />
              <Eyebrow className="text-sky-300/80">Explain</Eyebrow>
            </div>
            <div className="flex gap-1 rounded-full bg-white/5 p-0.5">
              {[
                { n: 1, label: "Greenhouse", passed: q1Passed, enabled: true },
                { n: 2, label: "Chloroplast", passed: q2Passed, enabled: q1Done },
              ].map((t) => (
                <button
                  key={t.n}
                  type="button"
                  disabled={!t.enabled}
                  onClick={() => setTab(t.n)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-30",
                    current === t.n ? "bg-sky-300 text-slate-950" : "text-white/60 hover:bg-white/10"
                  )}
                >
                  Q{t.n} · {t.label} {t.passed && "✓"}
                </button>
              ))}
            </div>
          </div>

          {current === 1 ? <Question1 /> : <Question2 />}

          {current === 1 && q1Done && (
            <div className="mt-3 flex justify-end">
              <PrimaryButton onClick={() => setTab(2)}>
                Next: the chloroplast <ArrowRight size={15} />
              </PrimaryButton>
            </div>
          )}
          {current === 2 && !q2Passed && q2Done && (
            <div className="mt-3 flex justify-end">
              <GhostButton onClick={() => goToStage("apply")}>
                Continue anyway <ArrowRight size={15} />
              </GhostButton>
            </div>
          )}
        </Panel>
      </motion.div>
    </div>
  );
}
