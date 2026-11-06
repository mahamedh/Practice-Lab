import React from "react";
import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";

export default function LoadingOverlay() {
  const { active, progress } = useProgress();
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-50 grid place-items-center bg-slate-950"
        >
          <div className="w-64 text-center text-white">
            <div className="text-sm font-semibold text-white/80">Preparing the greenhouse…</div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
