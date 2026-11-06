import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLabStore } from "../../sim/labStore";

const BACKDROP = {
  dive: "radial-gradient(circle at 50% 45%, #bbf7d0 0%, #16a34a 38%, #052e16 100%)",
  zoom: "radial-gradient(circle at 50% 50%, #d9f99d 0%, #15803d 45%, #022c22 100%)",
  case: "radial-gradient(circle at 50% 50%, #e9d5ff 0%, #4c1d95 55%, #1e1b4b 100%)",
};

export default function TransitionOverlay() {
  const transition = useLabStore((s) => s.transition);
  const show = transition?.phase === "in";
  const kind = transition?.kind ?? "zoom";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={transition.id}
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
          style={{ background: BACKDROP[kind] }}
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: kind === "dive" ? 0.9 : 0.55, ease: "easeInOut" }}
        >
          <motion.div
            className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold tracking-wide text-white backdrop-blur"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {kind === "dive" ? "Zooming into the leaf…" : kind === "case" ? "Loading the next mystery chloroplast…" : "Changing scale…"}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
