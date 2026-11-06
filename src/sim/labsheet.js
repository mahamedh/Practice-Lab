import chapter from "../data/chapter10_2.json";
import scenarios from "../data/scenarios.json";
import { challengeSummary, couplingTests } from "./advancedSlice";
import { computeMastery } from "./mastery";
import { simulate } from "./simulate";

const CHOICE = { increase: "increase", same: "stay the same", decrease: "decrease" };
const VAR = { light: "Light", water: "Water", co2: "CO₂" };

function lastOf(list) {
  return list[list.length - 1];
}

export function greenhouseCurve(trials) {
  const initial = scenarios.scenarios.A.initial;
  const points = [{ light: initial.light, activity: simulate(initial).activity }];
  trials
    .filter((t) => t.scenarioId === "A" && t.variable === "light")
    .forEach((t) => points.push({ light: t.to, activity: t.activityAfter }));
  const unique = new Map(points.map((p) => [p.light, p]));
  return [...unique.values()].sort((a, b) => a.light - b.light);
}

function answerQ1(s) {
  if (!s.co2Path.done) return "";
  return chapter.co2Path.order.map((id) => chapter.co2Path.steps[id]).join(" ");
}

function answerQ2(s) {
  const [e1, e2] = chapter.atoms.experiments;
  if (!s.atoms.runs.h2o18 && !s.atoms.runs.co2_18) return "";
  return [
    s.atoms.runs.h2o18 && `With ${e1.tracer} (experiment 1), ${e1.result.charAt(0).toLowerCase()}${e1.result.slice(1)}`,
    s.atoms.runs.co2_18 && `With ${e2.tracer} (experiment 2), ${e2.result.charAt(0).toLowerCase()}${e2.result.slice(1)}`,
    chapter.atoms.conclusion,
    "This supported van Niel’s hypothesis that plants split H₂O, just as sulfur bacteria split H₂S.",
  ]
    .filter(Boolean)
    .join(" ");
}

function answerQ3(s) {
  const { co2Off, lightOff } = couplingTests(s.chloroTrials);
  if (!co2Off) return "";
  return [
    "I would disagree.",
    `When I removed CO₂ with the light on, sugar output fell to ${co2Off.after.sugar}, ATP rose to ${co2Off.after.atp}% and O₂ release fell from ${co2Off.before.o2} to ${co2Off.after.o2}.`,
    "The light reactions need ADP and NADP⁺ returned by the Calvin cycle; without them they stop making ATP and NADPH, even in continual light.",
    lightOff && `Likewise, with the light off, sugar output fell from ${lightOff.before.sugar} to ${lightOff.after.sugar}: each stage depends on the other.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function defaultConclusion(s) {
  const limiting = s.trials.find((t) => t.scenarioId === "A" && t.variable === "light" && t.activityAfter > t.activityBefore);
  const flat = s.trials.find((t) => t.scenarioId === "A" && (t.kind === "nonLimitingUp" || t.kind === "coLimitedUp"));
  const e1 = lastOf(s.explainAttempts)?.text;
  const e2 = lastOf(s.explain2Attempts)?.text;
  return [
    limiting && `Light was the limiting factor in Greenhouse A: raising it from ${limiting.from} to ${limiting.to} increased activity from ${limiting.activityBefore} to ${limiting.activityAfter}.`,
    flat && `Raising ${VAR[flat.variable].toLowerCase()} (${flat.from} → ${flat.to}) had no effect because it was not limiting.`,
    "Photosynthesis happens in the chloroplasts of mesophyll cells. The light reactions in the thylakoids split water, releasing O₂, and make ATP and NADPH; the Calvin cycle in the stroma uses them to fix CO₂ into sugar and returns ADP and NADP⁺.",
    e1 && `In my words (greenhouse): ${e1.trim()}`,
    e2 && `In my words (chloroplast): ${e2.trim()}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildSheet(s) {
  const tests = couplingTests(s.chloroTrials);
  const challenge = challengeSummary(s);
  const mastery = computeMastery(s);
  const hypotheses = [
    s.hypothesis && `Greenhouse: photosynthesis would ${CHOICE[s.hypothesis.choice]} when sunlight increased.`,
    ...(s.whatIf ? chapter.whatIf.predictions.map((p) => `${p.scenario}: ${p.series.split(" (")[0].toLowerCase()} would ${CHOICE[s.whatIf[p.id]?.choice]}.`) : []),
    s.atoms.hypothesis && `Source of O₂: ${chapter.atoms.hypotheses.find((h) => h.id === s.atoms.hypothesis).claim} (${chapter.atoms.hypotheses.find((h) => h.id === s.atoms.hypothesis).name}).`,
  ].filter(Boolean);

  return {
    hypotheses,
    greenhouseTrials: s.trials,
    chloroTrials: s.chloroTrials,
    tests,
    curve: greenhouseCurve(s.trials),
    isotopes: chapter.atoms.experiments.map((e) => ({ ...e, run: Boolean(s.atoms.runs[e.id]) })),
    co2Path: s.co2Path,
    ledgerDone: s.atoms.ledgerDone,
    challenge,
    mastery,
    answers: {
      q1: s.sheet.answers.q1 ?? answerQ1(s),
      q2: s.sheet.answers.q2 ?? answerQ2(s),
      q3: s.sheet.answers.q3 ?? answerQ3(s),
    },
    conclusion: s.sheet.conclusion ?? defaultConclusion(s),
  };
}

export function exportSheetJson(s, extra = {}) {
  const sheet = buildSheet(s);
  return {
    lab: "Photosynthesis: from the greenhouse to the chloroplast",
    concept: chapter.concept,
    exportedAt: new Date().toISOString(),
    ...extra,
    hypotheses: sheet.hypotheses,
    greenhouseTrials: s.trials.map(({ id, scenarioId, variable, from, to, activityBefore, activityAfter, kind }) => ({ id, scenarioId, variable, from, to, activityBefore, activityAfter, kind })),
    chloroplastTrials: s.chloroTrials.map(({ id, variable, from, to, before, after, kind, inputs }) => ({ id, variable, from, to, before, after, kind, inputs })),
    co2Path: s.co2Path.picked,
    isotopeRuns: s.atoms.runs,
    atomLedgerComplete: s.atoms.ledgerDone,
    challenge: sheet.challenge.results.map((r) => ({ id: r.id, solved: Boolean(r.state.solved), justification: r.state.why?.text ?? null })),
    explanations: { greenhouse: lastOf(s.explainAttempts)?.text ?? null, chloroplast: lastOf(s.explain2Attempts)?.text ?? null, apply: s.applyWhy?.text ?? null },
    conceptCheck: sheet.answers,
    conclusion: sheet.conclusion,
    evaluation: s.sheet.evaluation,
    mastery: { level: sheet.mastery.level, evidence: sheet.mastery.evidence.map((e) => ({ id: e.id, met: Boolean(e.met) })), misconceptions: s.misconceptionStatus },
  };
}
