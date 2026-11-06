import React from "react";
import { Check, FlaskConical, Pin } from "lucide-react";
import chapter from "../../data/chapter10_2.json";
import { useLabStore } from "../../sim/labStore";
import { LabelledEquation } from "../hud/ReactionStrip";
import { DragToken, DropZone } from "./drag";
import { SectionLabel } from "./StagePanel";
import { cn } from "../ui";

const A = chapter.atoms;

export function HypothesisTask() {
  const hypothesis = useLabStore((s) => s.atoms.hypothesis);
  const pinHypothesis = useLabStore((s) => s.pinHypothesis);
  return (
    <div className="mt-3 space-y-3">
      <h2 className="text-xl font-bold leading-snug">{A.question}</h2>
      <p className="text-sm text-white/65">{A.hypothesisInstruction}</p>
      <div className="flex justify-center">
        <DragToken
          id="pin"
          label={
            <span className="flex items-center gap-1.5">
              <Pin size={14} /> My hypothesis
            </span>
          }
          accepts={A.hypotheses.map((h) => `hyp-${h.id}`)}
          onDrop={(dropId) => pinHypothesis(dropId.replace("hyp-", ""))}
          disabled={Boolean(hypothesis)}
          className="bg-amber-300 px-4 py-2 text-sm text-amber-950"
        />
      </div>
      {A.hypotheses.map((h) => (
        <DropZone key={h.id} id={`hyp-${h.id}`} className="rounded-xl">
          <div
            className={cn(
              "rounded-xl border p-3 transition",
              hypothesis === h.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-white/5"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-white">{h.name}</div>
              {hypothesis === h.id && <Pin size={15} className="text-amber-300" />}
            </div>
            <ul className="mt-1.5 space-y-0.5 font-mono text-[12px] text-white/75">
              {h.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <div className="mt-1.5 text-[12px] font-semibold text-amber-200">{h.claim}</div>
          </div>
        </DropZone>
      ))}
    </div>
  );
}

export function IsotopeTask() {
  const atoms = useLabStore((s) => s.atoms);
  const tracer = useLabStore((s) => s.tracer);
  const dropTracer = useLabStore((s) => s.dropTracer);
  const pinned = A.hypotheses.find((h) => h.id === atoms.hypothesis);
  const bothRun = atoms.runs.h2o18 && atoms.runs.co2_18;
  const supported = atoms.hypothesis === "water";

  return (
    <div className="mt-3 space-y-3">
      <h2 className="text-xl font-bold leading-snug">Run the ¹⁸O tracer experiments</h2>
      <p className="text-sm text-white/65">{A.isotopeInstruction}</p>
      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-[12px]">
        <span className="text-white/55">Your hypothesis</span>
        <span className="font-semibold text-amber-200">{pinned?.claim}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <DragToken
          id="o18"
          label="¹⁸O tag"
          accepts={["H2O", "CO2"]}
          onDrop={(target) => dropTracer(target)}
          disabled={Boolean(tracer)}
          className="bg-emerald-400 px-4 py-2 text-sm text-emerald-950 shadow-[0_0_22px_rgba(74,222,128,0.55)]"
        />
        <span className="text-[11px] text-white/50">→ drop on the H₂O or CO₂ label in the scene</span>
      </div>
      {A.experiments.map((exp) => {
        const done = atoms.runs[exp.id];
        const running = tracer?.id === exp.id;
        return (
          <div key={exp.id} className={cn("rounded-xl border p-3", done ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/5")}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold">
                {exp.label} · <span className="text-emerald-300">{exp.tracer}</span>
              </div>
              {done ? <Check size={16} className="text-emerald-300" strokeWidth={3} /> : running ? <FlaskConical size={16} className="animate-pulse text-emerald-300" /> : null}
            </div>
            {done || running ? (
              <>
                <LabelledEquation tokens={exp.equation} className="mt-2 font-mono text-[13px]" />
                <div className="mt-1.5 text-[12px] text-white/75">{running ? "Follow the glowing labeled atoms…" : exp.result}</div>
              </>
            ) : (
              <div className="mt-1 text-[12px] text-white/45">Not run yet.</div>
            )}
          </div>
        );
      })}
      {bothRun && (
        <div className={cn("rounded-xl p-3 text-sm", supported ? "bg-emerald-400/10 text-emerald-50" : "bg-amber-300/10 text-amber-50")}>
          <div className="font-semibold">{supported ? "Your hypothesis was supported." : "Your hypothesis was not supported."}</div>
          <div className="mt-0.5 text-[13px] opacity-90">{A.conclusion}</div>
        </div>
      )}
    </div>
  );
}

const TOKEN_TONE = { co2: "bg-fuchsia-300 text-fuchsia-950", h2o: "bg-sky-300 text-sky-950" };

export function LedgerTask() {
  const ledger = useLabStore((s) => s.atoms.ledger);
  const wrong = useLabStore((s) => s.atoms.ledgerWrong);
  const done = useLabStore((s) => s.atoms.ledgerDone);
  const placeAtom = useLabStore((s) => s.placeAtom);
  const slots = A.ledger.products.flatMap((p) => p.slots.map((x) => x.id));
  const tokenById = Object.fromEntries(A.ledger.tokens.map((t) => [t.id, t]));

  return (
    <div className="mt-3 space-y-3">
      <h2 className="text-xl font-bold leading-snug">Track every atom</h2>
      <p className="text-sm text-white/65">{A.ledger.instruction}</p>
      <div>
        <SectionLabel>Reactant atoms (drag)</SectionLabel>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {A.ledger.tokens.map((t) => (
            <DragToken
              key={t.id}
              id={t.id}
              label={`${t.atom} from ${t.from}`}
              accepts={slots}
              onDrop={(slotId) => placeAtom(slotId, t.id)}
              disabled={done}
              className={cn("px-3 py-1.5 text-[12px]", TOKEN_TONE[t.origin])}
            />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Products (drop)</SectionLabel>
        <div className="mt-1.5 space-y-2">
          {A.ledger.products.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
              <div className="w-[76px] shrink-0 font-mono text-sm font-bold text-white">{p.name}</div>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {p.slots.map((slot) => {
                  const placed = ledger[slot.id] ? tokenById[ledger[slot.id]] : null;
                  const isWrong = wrong?.slotId === slot.id;
                  return (
                    <DropZone key={slot.id} id={slot.id} active={!placed} className="rounded-lg">
                      <div
                        key={isWrong ? wrong.nonce : "ok"}
                        className={cn(
                          "flex min-w-[94px] items-center gap-1 rounded-lg border px-2 py-1 text-[11px]",
                          placed ? "border-transparent " + TOKEN_TONE[placed.origin] : isWrong ? "animate-[shake_0.35s] border-rose-400 bg-rose-500/15 text-rose-100" : "border-dashed border-white/25 text-white/55"
                        )}
                      >
                        <span className="font-mono font-bold">{slot.atom}</span>
                        <span>{placed ? `from ${placed.from}` : "drop here"}</span>
                      </div>
                    </DropZone>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {wrong && !done && <div className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-50">{wrong.hint}</div>}
      {done && <div className="rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-50">{A.ledger.done}</div>}
    </div>
  );
}
