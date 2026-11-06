import chapter from "../data/chapter10_2.json";
import rubric from "../data/rubric.json";
import misconceptions from "../data/misconceptions.json";
import { evaluateRubric } from "./rubric";
import { chloroRuntime, resetRuntime, snapshot } from "./chloroplast";

export const MICRO_STAGES = ["zoom", "challenge"];
export const worldFor = (stage) => (MICRO_STAGES.includes(stage) ? "micro" : "greenhouse");

export const DEFAULT_CHLORO = { light: 80, co2: 80, hSource: "H2O" };
export const CHLORO_SETTLE_S = 4;
export const TRACER_S = 5.2;
const OFF = 10;
const CHLORO_LABEL = { light: "Light", co2: "CO₂" };

const timers = new Set();
function later(fn, ms) {
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms);
  timers.add(id);
}
export function clearAdvancedTimers() {
  timers.forEach(clearTimeout);
  timers.clear();
}

export function advancedFreshState() {
  return {
    zoomLevel: 0,
    maxZoomLevel: 0,
    transition: null,
    co2Path: { picked: [], wrong: null, done: false },
    chloroInputs: { ...DEFAULT_CHLORO },
    chloroDrag: null,
    chloroPending: null,
    chloroTrials: [],
    chloro: snapshot(),
    microTool: "light",
    whatIf: null,
    atoms: { hypothesis: null, runs: {}, ledger: {}, ledgerWrong: null, ledgerDone: false },
    tracer: null,
    eqView: "net",
    explain2Attempts: [],
    challenge: { index: 0, cases: {} },
    sheet: { open: false, conclusion: null, evaluation: null, answers: {} },
    dragToken: null,
  };
}

export function couplingTests(trials) {
  return { co2Off: trials.find((t) => t.kind === "co2Off"), lightOff: trials.find((t) => t.kind === "lightOff") };
}

export function getZoomTask(s) {
  if (s.zoomLevel === 0 && !s.co2Path.done) return "co2path";
  if (s.zoomLevel < 3) return chapter.zoom.levels[s.zoomLevel].id;
  if (!s.whatIf) return "whatIf";
  const tests = couplingTests(s.chloroTrials);
  if (!tests.co2Off || !tests.lightOff) return "coupling";
  if (!s.atoms.hypothesis) return "hypothesis";
  if (!s.atoms.runs.h2o18 || !s.atoms.runs.co2_18) return "isotope";
  if (!s.atoms.ledgerDone) return "ledger";
  return "ready";
}

export function canAdjustChloro(s) {
  if (s.stage !== "zoom" || s.zoomLevel !== 3) return false;
  return getZoomTask(s) !== "whatIf";
}

export function currentCase(s) {
  return chapter.challenge.cases[s.challenge.index];
}

export function caseState(s, id) {
  return s.challenge.cases[id] ?? { step: 0, wrong: null, diagnosed: false, why: null, attempts: 0 };
}

export function challengeSummary(s) {
  const results = chapter.challenge.cases.map((c) => ({ ...c, state: caseState(s, c.id) }));
  const solved = results.filter((r) => r.state.solved).length;
  const attempted = results.filter((r) => r.state.why).length;
  return { results, solved, attempted, passed: solved >= chapter.challenge.passCount };
}

function evidenceMet(s, evidence) {
  if (evidence === "co2Off" || evidence === "lightOff") return Boolean(couplingTests(s.chloroTrials)[evidence]);
  if (evidence === "h2o18" || evidence === "co2_18") return Boolean(s.atoms.runs[evidence]);
  return true;
}

function applyClears(s, ideas = []) {
  let status = s.misconceptionStatus;
  const events = [];
  for (const [code, value] of Object.entries(status)) {
    const clear = misconceptions[code]?.clear;
    if (value !== "detected" || !clear?.evidence) continue;
    const byIdea = evidenceMet(s, clear.evidence) && ideas.find((i) => i.id === clear.idea)?.met;
    const byChallenge = clear.orChallenge && s.challenge.cases[clear.orChallenge]?.solved;
    if (byIdea || byChallenge) {
      status = { ...status, [code]: "cleared" };
      events.push({ type: "misconceptionCleared", code, t: Date.now(), stage: s.stage });
    }
  }
  return { misconceptionStatus: status, events: events.length ? [...s.events, ...events] : s.events };
}

function format(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function loadCase(index) {
  const c = chapter.challenge.cases[index];
  resetRuntime(DEFAULT_CHLORO);
  return { chloroInputs: { ...c.setup }, chloroPending: null, chloroDrag: null, tracer: null, chloro: snapshot() };
}

let chloroTrialId = 0;

export function onEnterStage(stage, s) {
  if (stage === "zoom") {
    resetRuntime(DEFAULT_CHLORO);
    return { chloroInputs: { ...DEFAULT_CHLORO }, chloroPending: null, chloroDrag: null, tracer: null, chloro: snapshot() };
  }
  if (stage === "challenge") {
    return { zoomLevel: 3, maxZoomLevel: 3, challenge: { ...s.challenge, index: s.challenge.index ?? 0 }, ...loadCase(s.challenge.index ?? 0) };
  }
  if (stage === "report") return { sheet: { ...s.sheet, open: false } };
  return {};
}

export const createAdvancedSlice = (set, get) => ({
  runTransition: (apply, { kind = "zoom", hold = 650 } = {}) => {
    const id = Date.now();
    set({ transition: { id, phase: "in", kind } });
    later(() => {
      apply();
      set({ transition: { id, phase: "out", kind } });
    }, hold);
    later(() => set((s) => (s.transition?.id === id ? { transition: null } : {})), hold + 700);
  },

  startDive: () => {
    if (get().transition) return;
    get().logEvent("dive");
    get().runTransition(() => get().goToStage("zoom"), { kind: "dive", hold: 1100 });
  },

  zoomTo: (level) => {
    const s = get();
    if (s.transition || level === s.zoomLevel || level < 0 || level > 3) return;
    if (level > s.maxZoomLevel + 1) return;
    if (level > 0 && !s.co2Path.done) return;
    get().runTransition(() => {
      set((st) => ({ zoomLevel: level, maxZoomLevel: Math.max(st.maxZoomLevel, level) }));
      get().logEvent("zoom", { level });
    });
  },

  pickStructure: (id) => {
    const s = get();
    if (s.stage === "challenge") return get().challengeClick(id);
    if (s.stage !== "zoom" || s.zoomLevel !== 0 || s.co2Path.done) return;
    const { order, hints } = chapter.co2Path;
    const expected = order[s.co2Path.picked.length];
    if (id === expected) {
      const picked = [...s.co2Path.picked, id];
      const done = picked.length === order.length;
      set({ co2Path: { picked, wrong: null, done } });
      get().logEvent("co2PathStep", { id, done });
    } else if (!s.co2Path.picked.includes(id)) {
      set({ co2Path: { ...s.co2Path, wrong: { id, hint: hints[expected], nonce: Date.now() } } });
      get().logEvent("co2PathWrong", { id, expected });
    }
  },

  selectMicroTool: (variable) => set({ microTool: variable }),
  setDragToken: (dragToken) => set({ dragToken }),

  setChloroInput: (variable, value) => {
    const s = get();
    if (!canAdjustChloro(s)) return;
    const next = Math.max(0, Math.min(100, Math.round(value)));
    if (s.chloroInputs[variable] === next) return;
    const chloroDrag = s.chloroDrag?.variable === variable ? s.chloroDrag : { variable, from: s.chloroInputs[variable], before: snapshot(), t0: chloroRuntime.t };
    set({ chloroInputs: { ...s.chloroInputs, [variable]: next }, chloroDrag });
  },

  commitChloro: () => {
    const s = get();
    const drag = s.chloroDrag;
    if (!drag) return;
    if (s.chloroPending) get().settleChloro();
    const to = get().chloroInputs[drag.variable];
    set({ chloroDrag: null });
    if (to === drag.from) return;
    set({ chloroPending: { ...drag, to, t0: chloroRuntime.t } });
  },

  toggleChloro: (variable) => {
    const s = get();
    if (!canAdjustChloro(s)) return;
    const value = s.chloroInputs[variable] > OFF ? 0 : DEFAULT_CHLORO[variable];
    get().setChloroInput(variable, value);
    get().commitChloro();
  },

  syncChloro: () => {
    const next = snapshot();
    const cur = get().chloro;
    if (cur.o2 !== next.o2 || cur.sugar !== next.sugar || cur.atp !== next.atp || cur.nadph !== next.nadph || cur.s !== next.s) set({ chloro: next });
    const p = get().chloroPending;
    if (p && chloroRuntime.t - p.t0 >= CHLORO_SETTLE_S) get().settleChloro();
    const tr = get().tracer;
    if (tr && chloroRuntime.t - tr.t0 >= TRACER_S) get().finishTracer();
  },

  settleChloro: () => {
    const s = get();
    const p = s.chloroPending;
    if (!p) return;
    const after = snapshot();
    const inputs = { ...s.chloroInputs };
    let kind = p.to > p.from ? "up" : "down";
    if (p.variable === "co2" && p.to <= OFF && p.from > OFF && inputs.light > 30) kind = "co2Off";
    if (p.variable === "light" && p.to <= OFF && p.from > OFF && inputs.co2 > 30) kind = "lightOff";
    const series = chloroRuntime.history.filter((h) => h.t >= p.t0 - 0.5 && h.t <= p.t0 + CHLORO_SETTLE_S + 0.05).map((h) => ({ ...h, t: +(h.t - p.t0).toFixed(2) }));
    const trial = { id: ++chloroTrialId, stage: s.stage, variable: p.variable, from: p.from, to: p.to, before: p.before, after, inputs, kind, series };
    const text = format(chapter.whatIf.trialText[kind], {
      Var: CHLORO_LABEL[p.variable],
      from: p.from,
      to: p.to,
      o2From: p.before.o2,
      o2: after.o2,
      sugarFrom: p.before.sugar,
      sugar: after.sugar,
      atp: after.atp,
    });
    const tone = after.sugar + after.o2 > p.before.sugar + p.before.o2 ? "up" : "down";
    const chloroTrials = [...s.chloroTrials, trial];
    const hadBoth = Object.values(couplingTests(s.chloroTrials)).every(Boolean);
    const hasBoth = Object.values(couplingTests(chloroTrials)).every(Boolean);
    const restore = s.stage === "zoom" && hasBoth && !hadBoth ? { chloroInputs: { ...s.chloroInputs, light: DEFAULT_CHLORO.light, co2: DEFAULT_CHLORO.co2 } } : {};
    set({ chloroPending: null, chloroTrials, toast: { id: `c${trial.id}`, tone, text }, ...restore });
    get().logEvent("chloroTrial", { kind });
  },

  confirmWhatIf: (predictions) => {
    const s = get();
    let status = s.misconceptionStatus;
    const events = [];
    for (const p of chapter.whatIf.predictions) {
      const choice = predictions[p.id]?.choice;
      if (choice !== p.correct && !status[p.misconception]) {
        status = { ...status, [p.misconception]: "detected" };
        events.push({ type: "misconceptionDetected", code: p.misconception, t: Date.now(), stage: s.stage });
      }
    }
    set({ whatIf: predictions, misconceptionStatus: status, events: [...s.events, ...events], microTool: "co2" });
    get().logEvent("whatIfPrediction", { o2NoCo2: predictions.o2NoCo2?.choice, sugarDark: predictions.sugarDark?.choice });
  },

  pinHypothesis: (id) => {
    const s = get();
    if (s.atoms.hypothesis) return;
    const code = "O2_COMES_FROM_CO2";
    const detect = id === misconceptions[code].trigger.hypothesis && !s.misconceptionStatus[code];
    set({
      atoms: { ...s.atoms, hypothesis: id },
      toast: null,
      misconceptionStatus: detect ? { ...s.misconceptionStatus, [code]: "detected" } : s.misconceptionStatus,
      events: detect ? [...s.events, { type: "misconceptionDetected", code, t: Date.now(), stage: s.stage }] : s.events,
    });
    get().logEvent("hypothesisPinned", { id });
  },

  dropTracer: (target) => {
    const s = get();
    if (s.tracer || !s.atoms.hypothesis) return false;
    const exp = chapter.atoms.experiments.find((e) => e.target === target);
    if (!exp) return false;
    const nonce = Date.now();
    set({ tracer: { id: exp.id, target, nonce, t0: chloroRuntime.t }, chloroInputs: { ...DEFAULT_CHLORO }, chloroPending: null, chloroDrag: null, toast: null });
    get().logEvent("tracer", { id: exp.id });
    return true;
  },

  finishTracer: () => {
    const st = get();
    const tr = st.tracer;
    if (!tr) return;
    const exp = chapter.atoms.experiments.find((e) => e.id === tr.id);
    set({
      tracer: null,
      atoms: { ...st.atoms, runs: { ...st.atoms.runs, [exp.id]: true } },
      toast: { id: `t${tr.nonce}`, tone: "up", text: `${exp.label} (${exp.tracer}): ${exp.result}` },
    });
  },

  placeAtom: (slotId, tokenId) => {
    const s = get();
    const slots = chapter.atoms.ledger.products.flatMap((p) => p.slots);
    const slot = slots.find((x) => x.id === slotId);
    if (!slot) return false;
    if (slot.answer !== tokenId) {
      set({ atoms: { ...s.atoms, ledgerWrong: { slotId, tokenId, hint: chapter.atoms.ledger.hints[slotId], nonce: Date.now() } } });
      get().logEvent("ledgerWrong", { slotId, tokenId });
      return false;
    }
    const ledger = { ...s.atoms.ledger, [slotId]: tokenId };
    const ledgerDone = slots.every((x) => ledger[x.id] === x.answer);
    set({ atoms: { ...s.atoms, ledger, ledgerWrong: null, ledgerDone } });
    if (ledgerDone) get().logEvent("ledgerDone");
    return true;
  },

  setEqView: (eqView) => set({ eqView }),

  submitExplanation2: (text) => {
    const result = evaluateRubric(text, rubric.explain2.ideas);
    set((s) => ({ explain2Attempts: [...s.explain2Attempts, { text, result, t: Date.now() }] }));
    set((s) => applyClears(s, result.ideas));
    get().logEvent("explanation2", { requiredMet: result.requiredMet });
    return result;
  },

  challengeClick: (id) => {
    const s = get();
    const c = currentCase(s);
    const st = caseState(s, c.id);
    const step = c.steps[st.step];
    if (!step || step.type !== "click" || st.diagnosed) return;
    get().answerChallengeStep(id === step.answer, { picked: id });
  },

  challengeDrop: (option) => {
    const s = get();
    const c = currentCase(s);
    const st = caseState(s, c.id);
    const step = c.steps[st.step];
    if (!step || step.type !== "drop" || st.diagnosed) return false;
    get().answerChallengeStep(option === step.answer, { picked: option });
    return option === step.answer;
  },

  answerChallengeStep: (correct, data) => {
    const s = get();
    const c = currentCase(s);
    const st = caseState(s, c.id);
    const step = c.steps[st.step];
    const next = correct
      ? { ...st, step: st.step + 1, wrong: null, diagnosed: st.step + 1 >= c.steps.length, picks: [...(st.picks ?? []), data.picked] }
      : { ...st, wrong: { hint: step.hint, picked: data.picked, nonce: Date.now() }, attempts: st.attempts + 1 };
    set({ challenge: { ...s.challenge, cases: { ...s.challenge.cases, [c.id]: next } } });
    get().logEvent("challengeStep", { caseId: c.id, correct, ...data });
  },

  submitChallengeWhy: (text) => {
    const s = get();
    const c = currentCase(s);
    const st = caseState(s, c.id);
    const result = evaluateRubric(text, rubric.challenge[c.id].ideas);
    const solved = st.diagnosed && result.requiredMet;
    const next = { ...st, why: { text, result }, whyAttempts: (st.whyAttempts ?? 0) + 1, solved: st.solved || solved };
    set({ challenge: { ...s.challenge, cases: { ...s.challenge.cases, [c.id]: next } } });
    set((cur) => applyClears(cur, []));
    get().logEvent("challengeWhy", { caseId: c.id, requiredMet: result.requiredMet });
    return result;
  },

  goToCase: (index) => {
    const s = get();
    if (index < 0 || index >= chapter.challenge.cases.length || index === s.challenge.index) return;
    get().runTransition(
      () => set((st) => ({ challenge: { ...st.challenge, index }, ...loadCase(index) })),
      { kind: "case", hold: 450 },
    );
  },

  openSheet: (open = true) => set((s) => ({ sheet: { ...s.sheet, open }, notebookOpen: false })),
  setSheetField: (key, value) => set((s) => ({ sheet: { ...s.sheet, [key]: value } })),
  setSheetAnswer: (id, value) => set((s) => ({ sheet: { ...s.sheet, answers: { ...s.sheet.answers, [id]: value } } })),
});
