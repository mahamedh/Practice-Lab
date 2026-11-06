import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sprout } from "lucide-react";
import scenarios from "../../data/scenarios.json";
import { useLabStore } from "../../sim/labStore";
import { worldFor } from "../../sim/advancedSlice";

const SUBTITLE = {
  A: "A plant that is not growing well.",
  B: "A different plant, a new problem.",
};

export default function ScenarioBanner() {
  const scenarioId = useLabStore((s) => s.scenarioId);
  const micro = useLabStore((s) => worldFor(s.stage) === "micro");
  const previous = useRef(scenarioId);
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (previous.current === scenarioId) return;
    previous.current = scenarioId;
    if (scenarioId !== "B" || micro) return;
    setShown(scenarioId);
    const timer = setTimeout(() => setShown(null), 2600);
    return () => clearTimeout(timer);
  }, [scenarioId, micro]);

  return (
    <AnimatePresence>
      {shown && !micro && (
        <motion.div
          key={shown}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none absolute inset-0 z-40 grid place-items-center"
        >
          <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-slate-950/75 px-8 py-5 shadow-2xl backdrop-blur-xl">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 text-slate-950">
              <Sprout size={30} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Apply</div>
              <div className="text-3xl font-bold">{scenarios.scenarios[shown].name}</div>
              <div className="mt-0.5 text-sm text-white/70">{SUBTITLE[shown]}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
