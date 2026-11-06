import React from "react";
import chapter from "../../data/chapter10_2.json";
import { useLabStore } from "../../sim/labStore";
import { cn } from "../ui";

const EQ = chapter.equations;
const ROLE_TONE = {
  co2: "text-slate-100",
  h2o: "text-sky-300",
  light: "text-amber-300",
  sugar: "text-violet-300",
  o2: "text-rose-300",
  h2oOut: "text-sky-200",
};
const ORIGIN_TONE = { co2: "text-fuchsia-300", h2o: "text-sky-300" };

function useActiveRoles() {
  return useLabStore((s) => {
    const c = s.chloro;
    const on = [];
    if (c.sugar > 8) on.push("co2", "sugar", "h2oOut");
    if (c.o2 > 8) on.push("h2o", "o2");
    if (s.chloroInputs.light > 10) on.push("light");
    return on.join(",");
  });
}

function Term({ token, active }) {
  if (!token.role) return <span className="px-0.5 text-white/40">{token.t}</span>;
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 font-semibold transition-all duration-300",
        ROLE_TONE[token.role],
        active ? "bg-white/15 shadow-[0_0_14px_rgba(255,255,255,0.18)]" : "opacity-45"
      )}
    >
      {token.t}
    </span>
  );
}

function OriginTerm({ token }) {
  if (!token.parts) return <span className="px-0.5 text-white/40">{token.t}</span>;
  return (
    <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-semibold">
      {token.parts.map((p, i) => (
        <span key={i} className={ORIGIN_TONE[p.o]}>
          {p.t}
        </span>
      ))}
    </span>
  );
}

export function LabelledEquation({ tokens, className }) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-1 gap-y-1", className)}>
      {tokens.map((tok, i) =>
        tok.parts ? (
          <span key={i} className="rounded bg-white/5 px-1 py-0.5 font-semibold">
            {tok.parts.map((p, j) => (
              <span key={j} className={p.label ? "rounded bg-emerald-400 px-0.5 text-emerald-950 shadow-[0_0_10px_rgba(74,222,128,0.8)]" : ""}>
                {p.label ? p.t.replace("O", "¹⁸O") : p.t}
              </span>
            ))}
          </span>
        ) : (
          <span key={i} className="text-white/40">
            {tok.t}
          </span>
        )
      )}
    </span>
  );
}

export default function ReactionStrip() {
  const view = useLabStore((s) => s.eqView);
  const setEqView = useLabStore((s) => s.setEqView);
  const sulfur = useLabStore((s) => s.chloroInputs.hSource === "H2S");
  const active = useActiveRoles().split(",");

  return (
    <div className="pointer-events-auto mx-auto flex max-w-[860px] flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 shadow-xl backdrop-blur-xl" data-testid="reaction-strip">
      <div className="flex items-center gap-1">
        {EQ.views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setEqView(v.id)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition",
              view === v.id ? "bg-emerald-400 text-slate-950" : "text-white/55 hover:bg-white/10 hover:text-white"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 font-mono text-[15px]">
        {sulfur ? (
          <span className="text-yellow-200">
            Sulfur bacteria: CO₂ + 2 H₂S → [CH₂O] + H₂O + 2 S <span className="font-sans text-[11px] text-white/50">(van Niel)</span>
          </span>
        ) : view === "origin" ? (
          <>
            {EQ.origin.reactants.map((t, i) => (
              <OriginTerm key={`r${i}`} token={t} />
            ))}
            <span className="px-1 text-white/40">→</span>
            {EQ.origin.products.map((t, i) => (
              <OriginTerm key={`p${i}`} token={t} />
            ))}
          </>
        ) : (
          (view === "redox" ? EQ.redox.line : EQ[view]).map((t, i) => <Term key={i} token={t} active={active.includes(t.role)} />)
        )}
      </div>
      {!sulfur && view === "redox" && (
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-violet-300">↓ {EQ.redox.reduced}</span>
          <span className="text-sky-300">↑ {EQ.redox.oxidized}</span>
          <span className="text-white/45">{EQ.redox.note}</span>
        </div>
      )}
      {!sulfur && view === "origin" && (
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-fuchsia-300">■ {EQ.origin.legend.co2}</span>
          <span className="text-sky-300">■ {EQ.origin.legend.h2o}</span>
          <span className="text-white/45">Molecules in the scene are tinted by origin.</span>
        </div>
      )}
    </div>
  );
}
