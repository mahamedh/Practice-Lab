import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useLabStore } from "../../sim/labStore";
import { cn } from "../ui";

const TONES = {
  up: { icon: TrendingUp, ring: "border-emerald-400/40", chip: "bg-emerald-400/20 text-emerald-300" },
  flat: { icon: Minus, ring: "border-amber-300/50", chip: "bg-amber-300/20 text-amber-200" },
  down: { icon: TrendingDown, ring: "border-rose-400/40", chip: "bg-rose-400/20 text-rose-300" },
};

export default function ChangeToast() {
  const toast = useLabStore((s) => s.toast);
  const dismissToast = useLabStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => dismissToast(toast.id), 6500);
    return () => clearTimeout(id);
  }, [toast, dismissToast]);

  return (
    <div className="flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "pointer-events-auto flex max-w-[640px] items-center gap-3 rounded-2xl border bg-slate-950/80 px-3 py-2.5 text-sm text-white shadow-xl backdrop-blur-xl",
              TONES[toast.tone].ring
            )}
          >
            {React.createElement(TONES[toast.tone].icon, { size: 28, className: cn("shrink-0 rounded-full p-1.5", TONES[toast.tone].chip) })}
            <span className="font-medium">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
