import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, FileText, Info, X } from "lucide-react";
import guide from "../../data/guide.json";
import scenarios from "../../data/scenarios.json";
import models from "../../data/models.json";
import labsheet from "../../data/labsheet.json";
import chapter from "../../data/chapter10_2.json";
import { VAR_LABEL, useLabStore } from "../../sim/labStore";
import { buildSheet } from "../../sim/labsheet";
import { cn, IconButton, PrimaryButton } from "../ui";

const CREDITS = Object.values(models)
  .filter((m) => m.url && m.credit)
  .map((m) => m.credit);

const KIND_LABEL = {
  limitingUp: { text: "Activity rose", tone: "text-emerald-300" },
  limitingUpNewLimit: { text: "Rose, new limit", tone: "text-emerald-300" },
  nonLimitingUp: { text: "No change", tone: "text-amber-200" },
  coLimitedUp: { text: "No change, co-limited", tone: "text-amber-200" },
  becameLimiting: { text: "Fell, now limiting", tone: "text-rose-300" },
  down: { text: "Activity fell", tone: "text-rose-300" },
  noChange: { text: "No change", tone: "text-white/60" },
};

const CHLORO_KIND = {
  co2Off: { text: "CO₂ off test", tone: "text-sky-300" },
  lightOff: { text: "Light off test", tone: "text-amber-200" },
  up: { text: "Supply raised", tone: "text-emerald-300" },
  down: { text: "Supply lowered", tone: "text-rose-300" },
};
const CHLORO_VAR = { light: "Light", co2: "CO₂" };

function TrialsTab() {
  const trials = useLabStore((s) => s.trials);
  const chloroTrials = useLabStore((s) => s.chloroTrials);
  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      {trials.length === 0 && chloroTrials.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-white/50">Every change you make is recorded here automatically.</div>
      )}
      {trials.map((t, i) => (
        <div key={t.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
          <div className="flex items-center justify-between text-[11px] text-white/45">
            <span>
              Trial {i + 1} · {scenarios.scenarios[t.scenarioId].name}
            </span>
            <span className={cn("font-semibold", KIND_LABEL[t.kind].tone)}>{KIND_LABEL[t.kind].text}</span>
          </div>
          <div className="mt-1 font-medium">
            {VAR_LABEL[t.variable]} {t.from} → {t.to}
          </div>
          <div className="font-mono text-xs text-white/70">
            Activity {t.activityBefore} → {t.activityAfter}
          </div>
        </div>
      ))}
      {chloroTrials.map((t, i) => (
        <div key={`c${t.id}`} className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-3 text-sm">
          <div className="flex items-center justify-between text-[11px] text-white/45">
            <span>Chloroplast test {i + 1}</span>
            <span className={cn("font-semibold", CHLORO_KIND[t.kind].tone)}>{CHLORO_KIND[t.kind].text}</span>
          </div>
          <div className="mt-1 font-medium">
            {CHLORO_VAR[t.variable]} {t.from} → {t.to}
          </div>
          <div className="font-mono text-xs text-white/70">
            O₂ {t.before.o2} → {t.after.o2} · ATP {t.before.atp} → {t.after.atp} · sugar {t.before.sugar} → {t.after.sugar}
          </div>
        </div>
      ))}
    </div>
  );
}

function SheetTab() {
  const state = useLabStore();
  const sheet = buildSheet(state);
  const rows = [
    { label: labsheet.sections.hypotheses, done: sheet.hypotheses.length >= 3, detail: `${sheet.hypotheses.length} recorded` },
    { label: "Greenhouse trials", done: state.trials.length > 0, detail: `${state.trials.length} trials` },
    { label: "Chloroplast tests", done: Boolean(sheet.tests.co2Off && sheet.tests.lightOff), detail: `${state.chloroTrials.length} tests` },
    { label: "¹⁸O experiments", done: sheet.isotopes.every((e) => e.run), detail: `${sheet.isotopes.filter((e) => e.run).length} of 2` },
    { label: labsheet.sections.conceptCheck, done: chapter.conceptCheck.every((q) => sheet.answers[q.id]), detail: `${chapter.conceptCheck.filter((q) => sheet.answers[q.id]).length} of 3 drafted` },
    { label: "Final challenge", done: sheet.challenge.passed, detail: `${sheet.challenge.solved} of 3 solved` },
  ];
  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      <p className="text-[12px] text-white/60">The lab sheet fills itself from your evidence. Open it any time to edit or save it.</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[12px]">
          <span className={r.done ? "text-emerald-200" : "text-white/70"}>
            {r.done ? "✓ " : "○ "}
            {r.label}
          </span>
          <span className="font-mono text-white/50">{r.detail}</span>
        </div>
      ))}
    </div>
  );
}

export default function Notebook() {
  const open = useLabStore((s) => s.notebookOpen);
  const toggleNotebook = useLabStore((s) => s.toggleNotebook);
  const openSheet = useLabStore((s) => s.openSheet);
  const [tab, setTab] = useState("trials");

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="pointer-events-auto absolute bottom-[132px] left-4 top-20 z-30 flex w-[340px] flex-col rounded-2xl border border-white/10 bg-slate-950/90 text-white shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 font-bold">
              <BookOpen size={16} className="text-emerald-300" /> Lab notebook
            </div>
            <IconButton label="Close notebook" onClick={() => toggleNotebook(false)}>
              <X size={15} />
            </IconButton>
          </div>
          <div className="flex gap-1 border-b border-white/10 px-3 py-2">
            {[
              { id: "trials", label: "Trials" },
              { id: "sheet", label: "Lab sheet" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn("rounded-full px-3 py-1 text-[12px] font-semibold transition", tab === t.id ? "bg-emerald-400 text-slate-950" : "text-white/60 hover:bg-white/10")}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === "trials" ? <TrialsTab /> : <SheetTab />}
          {tab === "sheet" ? (
            <div className="border-t border-white/10 p-3">
              <PrimaryButton onClick={() => openSheet(true)} className="w-full">
                <FileText size={15} /> Open the full lab sheet
              </PrimaryButton>
            </div>
          ) : (
            <>
              <div className="flex gap-2 border-t border-white/10 p-3 text-[11px] leading-4 text-white/50">
                <Info size={14} className="mt-0.5 shrink-0" />
                {guide.model}
              </div>
              <div className="px-3 pb-3 text-[10px] leading-4 text-white/35">3D models: {CREDITS.join(" · ")}</div>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
