import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { canLeaveExperiment, getGuide, useLabStore } from "../../sim/labStore";
import { PrimaryButton } from "../ui";
import chapter from "../../data/chapter10_2.json";
import { challengeSummary, getZoomTask } from "../../sim/advancedSlice";

const DIVE_TASKS = { leaf: 1, cell: 2, chloroplast: 3 };

function useAction() {
  const stage = useLabStore((s) => s.stage);
  const canLeave = useLabStore(canLeaveExperiment);
  const applyDone = useLabStore((s) => Boolean(s.applyWhy));
  const zoomTask = useLabStore((s) => (s.stage === "zoom" ? getZoomTask(s) : null));
  const challengeDone = useLabStore((s) => {
    if (s.stage !== "challenge") return false;
    const sum = challengeSummary(s);
    return sum.passed || sum.attempted === sum.results.length;
  });
  const goToStage = useLabStore((s) => s.goToStage);
  const startDive = useLabStore((s) => s.startDive);
  const zoomTo = useLabStore((s) => s.zoomTo);
  if (stage === "experiment" && canLeave) return { label: chapter.zoom.enter, onClick: startDive };
  if (stage === "zoom" && zoomTask in DIVE_TASKS)
    return { label: chapter.zoom.levels[DIVE_TASKS[zoomTask] - 1].hotspot, onClick: () => zoomTo(DIVE_TASKS[zoomTask]) };
  if (stage === "zoom" && zoomTask === "ready") return { label: "Explain my evidence", onClick: () => goToStage("explain") };
  if (stage === "apply" && applyDone) return { label: "Final challenge", onClick: () => goToStage("challenge") };
  if (challengeDone) return { label: "Write up the lab sheet", onClick: () => goToStage("report") };
  return null;
}

export default function GuideBubble() {
  const text = useLabStore((s) => getGuide(s).text);
  const action = useAction();
  if (!text) return null;

  return (
    <div className="flex justify-center px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto flex max-w-[760px] items-center gap-3 rounded-full border border-white/10 bg-slate-950/75 py-2 pl-2 pr-2 text-white shadow-xl backdrop-blur-xl"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-emerald-300">
            <MessageCircle size={16} />
          </span>
          <span className="pr-2 text-[15px] font-medium">{text}</span>
          {action && (
            <PrimaryButton onClick={action.onClick} className="shrink-0 py-2">
              {action.label} <ArrowRight size={15} />
            </PrimaryButton>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
