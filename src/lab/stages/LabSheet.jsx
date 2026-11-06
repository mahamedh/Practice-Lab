import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowRight, Download, Printer, X } from "lucide-react";
import labsheet from "../../data/labsheet.json";
import chapter from "../../data/chapter10_2.json";
import scenarios from "../../data/scenarios.json";
import { useLabStore } from "../../sim/labStore";
import { buildSheet, exportSheetJson } from "../../sim/labsheet";
import { LabelledEquation } from "../hud/ReactionStrip";

const VAR = { light: "Light", water: "Water", co2: "CO₂" };
const SERIES_COLORS = { o2: "#dc2626", atp: "#d97706", nadph: "#0891b2", sugar: "#7c3aed" };

function Section({ title, children }) {
  return (
    <section className="lab-sheet-section mt-7">
      <h2 className="border-b border-slate-200 pb-1 text-[15px] font-bold uppercase tracking-wide text-emerald-800">{title}</h2>
      <div className="mt-3 text-[13.5px] leading-relaxed text-slate-800">{children}</div>
    </section>
  );
}

function Editable({ value, onChange, rows = 4, placeholder }) {
  const lines = (value ?? "").split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 95)), 0);
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.max(rows, lines)}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-[13.5px] leading-relaxed text-slate-900 focus:border-emerald-500 focus:outline-none print:hidden"
      />
      <p className="hidden whitespace-pre-wrap print:block">{value || "—"}</p>
    </>
  );
}

function Table({ head, rows }) {
  return (
    <table className="w-full border-collapse text-left text-[12.5px]">
      <thead>
        <tr className="bg-slate-100 text-slate-600">
          {head.map((h) => (
            <th key={h} className="border border-slate-200 px-2 py-1 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={head.length} className="border border-slate-200 px-2 py-2 text-center text-slate-400">
              No data recorded.
            </td>
          </tr>
        )}
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="border border-slate-200 px-2 py-1 font-mono">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Axes({ w, h, pad, xLabel, yLabel }) {
  return (
    <>
      <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} stroke="#475569" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="#475569" />
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <text x={pad.l - 6} y={h - pad.b - (v / 100) * (h - pad.t - pad.b) + 3} fontSize="9" textAnchor="end" fill="#64748b">
            {v}
          </text>
          <line x1={pad.l} x2={w - pad.r} y1={h - pad.b - (v / 100) * (h - pad.t - pad.b)} y2={h - pad.b - (v / 100) * (h - pad.t - pad.b)} stroke="#e2e8f0" />
        </g>
      ))}
      <text x={(w + pad.l) / 2} y={h - 4} fontSize="10" textAnchor="middle" fill="#334155">
        {xLabel}
      </text>
      <text x={11} y={(h - pad.b + pad.t) / 2} fontSize="10" textAnchor="middle" fill="#334155" transform={`rotate(-90 11 ${(h - pad.b + pad.t) / 2})`}>
        {yLabel}
      </text>
    </>
  );
}

function LightGraph({ points }) {
  const w = 330;
  const h = 200;
  const pad = { l: 40, r: 12, t: 12, b: 34 };
  const x = (v) => pad.l + (v / 100) * (w - pad.l - pad.r);
  const y = (v) => h - pad.b - (v / 100) * (h - pad.t - pad.b);
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <Axes w={w} h={h} pad={pad} xLabel="Light intensity" yLabel="Photosynthetic activity" />
        <polyline points={points.map((p) => `${x(p.light)},${y(p.activity)}`).join(" ")} fill="none" stroke="#059669" strokeWidth="2.2" />
        {points.map((p) => (
          <circle key={p.light} cx={x(p.light)} cy={y(p.activity)} r="3.5" fill="#059669" />
        ))}
      </svg>
      <figcaption className="text-center text-[11.5px] text-slate-500">Graph 1 · Greenhouse A: activity vs light (water 80, CO₂ 80)</figcaption>
    </figure>
  );
}

function TransientGraph({ trial, title }) {
  const w = 330;
  const h = 200;
  const pad = { l: 40, r: 12, t: 12, b: 34 };
  if (!trial?.series?.length) {
    return <div className="grid h-[200px] place-items-center rounded border border-dashed border-slate-300 text-[12px] text-slate-400">{title}: not run</div>;
  }
  const t0 = trial.series[0].t;
  const t1 = trial.series[trial.series.length - 1].t;
  const x = (t) => pad.l + ((t - t0) / (t1 - t0 || 1)) * (w - pad.l - pad.r);
  const y = (v) => h - pad.b - (v / 100) * (h - pad.t - pad.b);
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <Axes w={w} h={h} pad={pad} xLabel="Time after the change (s)" yLabel="Level (% of max)" />
        <line x1={x(0)} x2={x(0)} y1={pad.t} y2={h - pad.b} stroke="#94a3b8" strokeDasharray="3 3" />
        {Object.entries(SERIES_COLORS).map(([k, c]) => (
          <polyline key={k} points={trial.series.map((p) => `${x(p.t)},${y(p[k])}`).join(" ")} fill="none" stroke={c} strokeWidth="2" strokeDasharray={k === "atp" || k === "nadph" ? "4 3" : undefined} />
        ))}
      </svg>
      <figcaption className="text-center text-[11.5px] text-slate-500">{title}</figcaption>
    </figure>
  );
}

export default function LabSheet() {
  const state = useLabStore();
  const sheet = useMemo(() => buildSheet(state), [state]);
  const { stage, setSheetField, setSheetAnswer, openSheet, finish } = state;
  const asReport = stage === "report";
  const evaluation = state.sheet.evaluation ?? labsheet.evaluation.default;

  const download = () => {
    const data = exportSheetJson(state, { student: state.sheet.student ?? "" });
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "photosynthesis-lab-sheet.json" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return createPortal(
    <motion.div
      id="lab-sheet-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/75 px-4 py-6 backdrop-blur-md"
    >
      <div className="mx-auto mb-3 flex max-w-[880px] items-center justify-between gap-2 print:hidden">
        <div className="text-sm font-semibold text-white/80">{labsheet.printNote}</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100">
            <Printer size={15} /> Save as PDF
          </button>
          <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20">
            <Download size={15} /> JSON
          </button>
          {asReport ? (
            <button type="button" onClick={finish} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 px-4 py-2 text-sm font-bold text-slate-950">
              See my mastery report <ArrowRight size={15} />
            </button>
          ) : (
            <button type="button" onClick={() => openSheet(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close lab sheet">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <article id="lab-sheet" className="mx-auto max-w-[880px] select-text rounded-2xl bg-white px-12 py-10 text-slate-900 shadow-2xl">
        <header className="flex items-start justify-between gap-6 border-b-2 border-emerald-600 pb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">{labsheet.course}</div>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{labsheet.title}</h1>
          </div>
          <div className="w-[220px] shrink-0 space-y-1 text-[12px]">
            <label className="flex items-center gap-2">
              <span className="w-12 text-slate-500">Name</span>
              <input
                value={state.sheet.student ?? ""}
                onChange={(e) => setSheetField("student", e.target.value)}
                className="flex-1 border-b border-slate-300 bg-transparent px-1 py-0.5 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <div className="flex gap-2">
              <span className="w-12 text-slate-500">Date</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        <Section title="Aim">
          <p>{labsheet.aim}</p>
          <ul className="mt-2 list-disc pl-5 text-[12.5px] text-slate-600">
            {labsheet.references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>

        <Section title={labsheet.sections.hypotheses}>
          {sheet.hypotheses.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {sheet.hypotheses.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400">No hypotheses recorded.</p>
          )}
        </Section>

        <Section title={labsheet.sections.variables}>
          <Table
            head={["", "Greenhouse", "Chloroplast"]}
            rows={["independent", "dependent", "controlled"].map((k) => [
              k.charAt(0).toUpperCase() + k.slice(1),
              labsheet.variables.greenhouse[k],
              labsheet.variables.chloroplast[k],
            ])}
          />
        </Section>

        <Section title={labsheet.sections.method}>
          <ol className="list-decimal space-y-1 pl-5">
            {labsheet.method.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
        </Section>

        <Section title={labsheet.sections.results}>
          <h3 className="mb-1.5 font-semibold">Table 1 · Greenhouse trials</h3>
          <Table
            head={["#", "Greenhouse", "Change", "Activity", "Limited by after"]}
            rows={sheet.greenhouseTrials.map((t, i) => [
              i + 1,
              scenarios.scenarios[t.scenarioId].name.replace("Greenhouse ", ""),
              `${VAR[t.variable]} ${t.from} → ${t.to}`,
              `${t.activityBefore} → ${t.activityAfter}`,
              t.limitingAfter.map((v) => VAR[v]).join(", "),
            ])}
          />
          <h3 className="mb-1.5 mt-4 font-semibold">Table 2 · Chloroplast tests (after about 4 s)</h3>
          <Table
            head={["#", "Change", "O₂ / S", "ATP %", "NADPH %", "Sugar"]}
            rows={sheet.chloroTrials.map((t, i) => [
              i + 1,
              `${VAR[t.variable]} ${t.from} → ${t.to}`,
              `${t.before.o2 || t.before.s} → ${t.after.o2 || t.after.s}`,
              `${t.before.atp} → ${t.after.atp}`,
              `${t.before.nadph} → ${t.after.nadph}`,
              `${t.before.sugar} → ${t.after.sugar}`,
            ])}
          />
          <h3 className="mb-1.5 mt-4 font-semibold">Table 3 · ¹⁸O tracer experiments</h3>
          <div className="space-y-1.5">
            {sheet.isotopes.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center gap-2 rounded border border-slate-200 px-2 py-1.5 text-[12.5px]">
                <span className="w-[150px] font-semibold">
                  {e.label} · {e.tracer}
                </span>
                {e.run ? (
                  <>
                    <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[12px] text-white">
                      <LabelledEquation tokens={e.equation} />
                    </span>
                    <span className="text-slate-600">{e.result}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Not run</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px]">
            <span className="font-semibold">CO₂ path traced:</span>{" "}
            {sheet.co2Path.done ? sheet.co2Path.picked.map((id) => chapter.zoom.structures[id]).join(" → ") : "incomplete"} ·{" "}
            <span className="font-semibold">Atom ledger (Fig. 10.4):</span> {sheet.ledgerDone ? "complete" : "incomplete"}
          </p>
          <p className="mt-1 text-[12.5px]">
            <span className="font-semibold">Final challenge:</span>{" "}
            {sheet.challenge.results.map((r) => `${r.title.split(" · ")[1]} ${r.state.solved ? "✓" : r.state.why ? "✗" : "–"}`).join(" · ")}
          </p>
        </Section>

        <Section title={labsheet.sections.graphs}>
          <div className="grid grid-cols-2 gap-5">
            <LightGraph points={sheet.curve} />
            <TransientGraph trial={sheet.tests.co2Off} title="Graph 2 · CO₂ removed, light on" />
            <TransientGraph trial={sheet.tests.lightOff} title="Graph 3 · Light off, CO₂ present" />
            <div className="flex flex-col justify-center gap-1.5 text-[12px]">
              {Object.entries(SERIES_COLORS).map(([k, c]) => (
                <span key={k} className="flex items-center gap-2">
                  <span className="inline-block h-0.5 w-6" style={{ background: c }} /> {k === "o2" ? "O₂ release" : k === "atp" ? "ATP (dashed)" : k === "nadph" ? "NADPH (dashed)" : "Sugar output"}
                </span>
              ))}
              <span className="mt-1 text-slate-500">{chapter.modelNote}</span>
            </div>
          </div>
        </Section>

        <Section title={labsheet.sections.conceptCheck}>
          <div className="space-y-4">
            {chapter.conceptCheck.map((q, i) => (
              <div key={q.id}>
                <p className="font-semibold">
                  {i + 1}. {q.tag && <span className="text-emerald-700">{q.tag} </span>}
                  {q.text}
                </p>
                <div className="mt-1.5">
                  <Editable value={sheet.answers[q.id]} onChange={(v) => setSheetAnswer(q.id, v)} rows={3} placeholder="Write your answer…" />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title={labsheet.sections.conclusion}>
          <p className="mb-1.5 text-[12px] text-slate-500 print:hidden">{labsheet.conclusionPrompt}</p>
          <Editable value={sheet.conclusion} onChange={(v) => setSheetField("conclusion", v)} rows={6} />
        </Section>

        <Section title={labsheet.sections.evaluation}>
          <p className="mb-1.5 text-[12px] text-slate-500 print:hidden">{labsheet.evaluation.prompt}</p>
          <Editable value={evaluation} onChange={(v) => setSheetField("evaluation", v)} rows={4} />
        </Section>

        <footer className="mt-8 border-t border-slate-200 pt-3 text-[11px] text-slate-400">
          Generated from the Practice Lab evidence · {chapter.concept}: {chapter.title}
        </footer>
      </article>
    </motion.div>,
    document.body
  );
}
