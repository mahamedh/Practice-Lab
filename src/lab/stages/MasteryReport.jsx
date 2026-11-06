import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, BookOpen, Check, CircleDashed, FileText, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import { useLabStore } from "../../sim/labStore";
import { computeMastery } from "../../sim/mastery";
import { exitFullscreen } from "../fullscreen";
import { cn, Eyebrow, GhostButton, Panel, PrimaryButton } from "../ui";

const LEVEL_STYLE = {
  mastered: { badge: "from-emerald-400 to-lime-300", icon: Trophy, eyebrow: "text-emerald-300" },
  developing: { badge: "from-amber-300 to-yellow-200", icon: Lightbulb, eyebrow: "text-amber-200" },
  retry: { badge: "from-rose-400 to-orange-300", icon: RotateCcw, eyebrow: "text-rose-300" },
};

export default function MasteryReport() {
  const state = useLabStore();
  const { restart, closeLab, openSheet } = state;
  const report = useMemo(() => computeMastery(state), [state]);
  const style = LEVEL_STYLE[report.level];
  const Icon = style.icon;
  const metCount = report.evidence.filter((e) => e.met).length;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-start bg-gradient-to-r from-slate-950/70 via-slate-950/25 to-transparent px-8">
      <motion.div initial={{ opacity: 0, x: -24, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.45 }}>
        <Panel className="max-h-[calc(100dvh-120px)] w-[820px] overflow-y-auto p-7">
          <div className="flex items-start gap-4">
            <div className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-slate-950", style.badge)}>
              <Icon size={28} />
            </div>
            <div>
              <Eyebrow className={style.eyebrow}>{report.concept}</Eyebrow>
              <h2 className="mt-1 text-3xl font-bold">{report.title}</h2>
              <p className="mt-2 text-white/75">{report.body}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300" style={{ width: `${(metCount / report.evidence.length) * 100}%` }} />
            </div>
            <span className="text-sm font-semibold tabular-nums text-white/70">
              {metCount} / {report.evidence.length} evidence
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {report.evidence.map((e) => (
              <div key={e.id} className={cn("flex gap-3 rounded-xl border p-3", e.met ? "border-emerald-400/25 bg-emerald-400/5" : "border-amber-300/25 bg-amber-300/5")}>
                <div className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", e.met ? "bg-emerald-400 text-slate-950" : "bg-amber-300/20 text-amber-200")}>
                  {e.met ? <Check size={14} strokeWidth={3} /> : <CircleDashed size={14} />}
                </div>
                <div className="text-[13px]">
                  <div className="font-semibold">{e.label}</div>
                  <div className="text-[11px] text-white/45">{e.requirement}</div>
                  <div className="mt-1 text-white/75">{e.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {report.corrected.map((m) => (
            <div key={m.code} className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-200">
                <Lightbulb size={15} /> Misconception corrected: "{m.label}"
              </div>
              <p className="mt-1 text-white/70">{m.feedback}</p>
            </div>
          ))}
          {report.unresolved.map((m) => (
            <div key={m.code} className="mt-4 rounded-xl border border-rose-300/25 bg-rose-300/5 p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold text-rose-200">
                <AlertTriangle size={15} /> Still to correct: "{m.label}"
              </div>
              <p className="mt-1 text-white/70">{m.feedback}</p>
            </div>
          ))}

          <div className="mt-6 flex justify-end gap-2">
            <GhostButton
              onClick={() => {
                exitFullscreen();
                closeLab();
              }}
            >
              <BookOpen size={15} /> Back to the chapter
            </GhostButton>
            <GhostButton onClick={() => openSheet(true)}>
              <FileText size={15} /> Lab sheet
            </GhostButton>
            <PrimaryButton onClick={restart}>
              <RotateCcw size={15} /> Try the lab again
            </PrimaryButton>
          </div>
        </Panel>
      </motion.div>
    </div>
  );
}
