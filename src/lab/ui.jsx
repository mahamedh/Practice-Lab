import React from "react";

export function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export function Panel({ className = "", children, ...props }) {
  return (
    <div
      className={cn(
        "pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/70 text-white shadow-2xl shadow-black/40 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-900/40 transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className = "", children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ className = "", label, children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Eyebrow({ children, className = "" }) {
  return <div className={cn("text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80", className)}>{children}</div>;
}
