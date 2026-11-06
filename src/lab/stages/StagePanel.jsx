import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eyebrow, Panel } from "../ui";

export default function StagePanel({ icon: Icon, eyebrow, tone = "text-emerald-300", width = "w-[420px]", panelKey, source, children }) {
  return (
    <div className="pointer-events-none absolute inset-y-1 right-5 flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={panelKey}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className="flex max-h-full"
        >
          <Panel className={`max-h-full ${width} overflow-y-auto p-5`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {Icon && <Icon size={18} className={tone} />}
                <Eyebrow className={`${tone} opacity-90`}>{eyebrow}</Eyebrow>
              </div>
              {source && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/45">{source}</span>}
            </div>
            {children}
          </Panel>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function SectionLabel({ children }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-white/45">{children}</div>;
}
