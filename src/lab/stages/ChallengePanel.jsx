import React from "react";
import { ArrowRight, Check, MousePointerClick, Trophy, X } from "lucide-react";
import chapter from "../../data/chapter10_2.json";
import rubric from "../../data/rubric.json";
import { useLabStore } from "../../sim/labStore";
import { caseState, challengeSummary, currentCase } from "../../sim/advancedSlice";
import StagePanel, { SectionLabel } from "./StagePanel";
import AnswerBox from "./AnswerBox";
import { DragToken, DropZone } from "./drag";
import { cn, GhostButton, PrimaryButton } from "../ui";

const C = chapter.challenge;
const S = chapter.zoom.structures;
const OPTION_LABEL = { S: "S (sulfur)", O2: "O₂ (oxygen)" };

function CaseTabs() {
  const index = useLabStore((s) => s.challenge.index);
  const summary = useLabStore(challengeSummary);
  const goToCase = useLabStore((s) => s.goToCase);
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5">
      {summary.results.map((r, i) => (
        <button
          key={r.id}
          type="button"
          onClick={() => goToCase(i)}
          className={cn(
            "flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
            i === index ? "border-violet-300 bg-violet-300/15 text-white" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
          )}
        >
          {r.state.solved ? <Check size={12} className="text-emerald-300" strokeWidth={3} /> : r.state.why ? <X size={12} className="text-amber-300" /> : null}
          Case {i + 1}
        </button>
      ))}
    </div>
  );
}

function DropStep({ step }) {
  const challengeDrop = useLabStore((s) => s.challengeDrop);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-xl bg-white/5 p-3 font-mono text-[13px]">
        CO₂ + 2 H₂S → [CH₂O] + H₂O + 2
        <DropZone id="product" className="rounded-md">
          <span className="inline-block min-w-[46px] rounded-md border border-dashed border-white/40 px-2 py-0.5 text-center text-white/60">?</span>
        </DropZone>
      </div>
      <div className="flex gap-2">
        {step.options.map((o) => (
          <DragToken
            key={o}
            id={`opt-${o}`}
            label={OPTION_LABEL[o]}
            accepts={["product"]}
            onDrop={() => challengeDrop(o)}
            className={cn("px-3 py-1.5 text-[12px]", o === "S" ? "bg-yellow-300 text-yellow-950" : "bg-rose-300 text-rose-950")}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChallengePanel() {
  const c = useLabStore(currentCase);
  const st = useLabStore((s) => caseState(s, currentCase(s).id));
  const index = useLabStore((s) => s.challenge.index);
  const summary = useLabStore(challengeSummary);
  const submitWhy = useLabStore((s) => s.submitChallengeWhy);
  const goToCase = useLabStore((s) => s.goToCase);
  const goToStage = useLabStore((s) => s.goToStage);
  const step = c.steps[Math.min(st.step, c.steps.length - 1)];
  const ideas = rubric.challenge[c.id];
  const nextIndex = summary.results.findIndex((r, i) => i !== index && !r.state.why);
  const finished = summary.passed || summary.attempted === summary.results.length;

  return (
    <StagePanel icon={Trophy} eyebrow="Final challenge" tone="text-violet-300" source={`Pass: ${C.passCount} of ${summary.results.length}`} panelKey={c.id} width="w-[430px]">
      <CaseTabs />
      <h2 className="mt-3 text-xl font-bold leading-snug">{c.title}</h2>
      <p className="mt-1 text-sm text-white/70">{c.story}</p>

      <div className="mt-3 space-y-2">
        <SectionLabel>Diagnose</SectionLabel>
        {c.steps.map((s, i) => {
          const done = i < st.step;
          const active = i === st.step && !st.diagnosed;
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                done ? "bg-emerald-400/10 text-emerald-50" : active ? "bg-white/10 text-white" : "bg-white/[0.03] text-white/35"
              )}
            >
              {done ? <Check size={15} className="mt-0.5 shrink-0 text-emerald-300" strokeWidth={3} /> : <MousePointerClick size={15} className="mt-0.5 shrink-0" />}
              <span>
                {s.prompt}
                {done && st.picks?.[i] && <span className="ml-1 font-semibold">({S[st.picks[i]] ?? OPTION_LABEL[st.picks[i]]})</span>}
              </span>
            </div>
          );
        })}
        {!st.diagnosed && step.type === "drop" && <DropStep step={step} />}
        {!st.diagnosed && st.wrong && (
          <div key={st.wrong.nonce} className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-50">
            Not {S[st.wrong.picked]?.toLowerCase() ?? OPTION_LABEL[st.wrong.picked]}. {st.wrong.hint}
          </div>
        )}
      </div>

      {st.diagnosed && (
        <div className="mt-4 space-y-2">
          <SectionLabel>Justify</SectionLabel>
          <div className="text-[15px] font-semibold leading-snug">{c.why}</div>
          <AnswerBox key={c.id} placeholder={ideas.placeholder} starters={ideas.starters} ideas={ideas.ideas} result={st.why} onSubmit={submitWhy} submitLabel="Check my justification" />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
        <span className="text-[12px] text-white/55">
          Solved {summary.solved} of {summary.results.length}
        </span>
        <div className="flex items-center gap-2">
          {st.why && nextIndex >= 0 && (
            <GhostButton onClick={() => goToCase(nextIndex)}>
              Next case <ArrowRight size={15} />
            </GhostButton>
          )}
          {finished && (
            <PrimaryButton onClick={() => goToStage("report")}>
              Write up the lab sheet <ArrowRight size={15} />
            </PrimaryButton>
          )}
        </div>
      </div>
    </StagePanel>
  );
}
