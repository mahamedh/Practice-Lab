import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf } from "lucide-react";
import scenarios from "../../data/scenarios.json";
import rubric from "../../data/rubric.json";
import { useLabStore } from "../../sim/labStore";
import { getApplyFlags } from "../../sim/mastery";
import AnswerBox from "./AnswerBox";
import { Eyebrow, Panel } from "../ui";

export default function ApplyWhyPanel() {
  const solved = useLabStore((s) => getApplyFlags(s).solved);
  const applyWhy = useLabStore((s) => s.applyWhy);
  const submitApplyWhy = useLabStore((s) => s.submitApplyWhy);
  const [attempts, setAttempts] = useState(0);
  const why = scenarios.scenarios.B.why;
  const visible = solved || applyWhy;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          className="pointer-events-none absolute bottom-2 right-5"
        >
          <Panel className="w-[400px] p-5">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-emerald-300" />
              <Eyebrow>Step 4 · Apply</Eyebrow>
            </div>
            <h2 className="mt-2 text-lg font-bold leading-snug">{why.question}</h2>
            <div className="mt-3">
              <AnswerBox
                placeholder={why.placeholder}
                starters={why.starters}
                ideas={rubric.applyWhy.ideas}
                result={applyWhy}
                submitLabel={attempts > 0 && !applyWhy?.result.requiredMet ? "Check again" : "Check my answer"}
                onSubmit={(text) => {
                  setAttempts((n) => n + 1);
                  submitApplyWhy(text);
                }}
              />
            </div>
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
