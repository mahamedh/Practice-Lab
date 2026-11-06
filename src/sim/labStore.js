import { create } from "zustand";
import scenarios from "../data/scenarios.json";
import guide from "../data/guide.json";
import rubric from "../data/rubric.json";
import misconceptions from "../data/misconceptions.json";
import { classifyChange, clampInput, simulate } from "./simulate";
import { evaluateRubric } from "./rubric";
import { getApplyFlags, getExperimentFlags } from "./mastery";
import {
  advancedFreshState,
  challengeSummary,
  clearAdvancedTimers,
  couplingTests,
  createAdvancedSlice,
  currentCase,
  caseState,
  getZoomTask,
  onEnterStage,
} from "./advancedSlice";

export const STAGES = ["intro", "predict", "experiment", "zoom", "explain", "apply", "challenge", "report", "mastery"];
const STAGE_SCENARIO = {
  intro: "A",
  predict: "A",
  experiment: "A",
  zoom: "A",
  explain: "A",
  apply: "B",
  challenge: "B",
  report: "B",
  mastery: "B",
};
const INTERACTIVE_STAGES = ["experiment", "apply"];

export const VAR_LABEL = Object.fromEntries(Object.entries(scenarios.variables).map(([key, v]) => [key, v.label]));
const VAR_INLINE = { light: "light", water: "water", co2: "CO₂" };

export function describeLimiting(list) {
  return list.map((key) => VAR_INLINE[key]).join(" and ") || "nothing";
}

function format(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
}

function scenarioState(id) {
  const inputs = { ...scenarios.scenarios[id].initial };
  return { scenarioId: id, inputs, ...simulate(inputs), pending: {} };
}

function freshState() {
  return {
    stage: "intro",
    ...scenarioState("A"),
    selectedTool: null,
    cameraFocus: null,
    focusNonce: 0,
    dragging: null,
    hypothesis: null,
    trials: [],
    events: [],
    toast: null,
    explainAttempts: [],
    applyWhy: null,
    misconceptionStatus: {},
    notebookOpen: false,
    run: 1,
    ...advancedFreshState(),
  };
}

let trialId = 0;

export const useLabStore = create((set, get) => ({
  open: false,
  controls: null,
  ...freshState(),
  ...createAdvancedSlice(set, get),

  setControls: (controls) => set({ controls }),

  logEvent: (type, data = {}) =>
    set((s) => ({ events: [...s.events, { type, ...data, t: Date.now(), stage: s.stage, scenarioId: s.scenarioId }] })),

  openLab: () => {
    clearAdvancedTimers();
    set({ ...freshState(), open: true });
  },
  closeLab: () => {
    clearAdvancedTimers();
    set({ open: false, dragging: null, transition: null });
  },
  restart: () => {
    clearAdvancedTimers();
    set({ ...freshState(), open: true });
  },

  startMission: () => {
    set({ stage: "predict" });
    get().logEvent("missionStarted");
  },

  confirmPrediction: (choice, end) => {
    set({ hypothesis: { choice, end }, stage: "experiment", ...scenarioState("A"), selectedTool: "light" });
    get().logEvent("prediction", { choice });
  },

  goToStage: (stage) => {
    const s = get();
    const scenarioId = STAGE_SCENARIO[stage];
    const patch = { stage, dragging: null, notebookOpen: false, cameraFocus: null, toast: null };
    if (scenarioId !== s.scenarioId || stage === "experiment" || stage === "apply") Object.assign(patch, scenarioState(scenarioId));
    if (stage === "experiment") patch.selectedTool = "light";
    if (stage === "apply") patch.selectedTool = null;
    Object.assign(patch, onEnterStage(stage, s));
    set(patch);
    get().logEvent("stage", { to: stage });
  },

  selectTool: (variable) => set({ selectedTool: variable }),
  focusTool: (variable) =>
    set((s) => {
      const focus = s.cameraFocus === variable ? null : variable;
      return { selectedTool: variable || s.selectedTool, cameraFocus: focus, focusNonce: s.focusNonce + 1 };
    }),
  setDragging: (variable) => set({ dragging: variable }),
  toggleNotebook: (value) => set((s) => ({ notebookOpen: value ?? !s.notebookOpen })),
  dismissToast: (id) => set((s) => (s.toast?.id === id ? { toast: null } : {})),

  setInput: (variable, value) => {
    const s = get();
    if (!INTERACTIVE_STAGES.includes(s.stage)) return;
    const next = clampInput(value);
    if (s.inputs[variable] === next) return;
    const pending = s.pending[variable]
      ? s.pending
      : { ...s.pending, [variable]: { from: s.inputs[variable], before: { activity: s.activity, limiting: s.limiting } } };
    const inputs = { ...s.inputs, [variable]: next };
    set({ inputs, ...simulate(inputs), pending });
  },

  commitChanges: () => {
    const s = get();
    const entries = Object.entries(s.pending);
    if (!entries.length) return;
    const after = { activity: s.activity, limiting: s.limiting };
    let { trials, misconceptionStatus, toast, events } = s;

    for (const [variable, p] of entries) {
      const to = s.inputs[variable];
      if (to === p.from) continue;
      const kind = classifyChange({ variable, from: p.from, to, before: p.before, after });
      const trial = {
        id: ++trialId,
        run: s.run,
        scenarioId: s.scenarioId,
        stage: s.stage,
        variable,
        from: p.from,
        to,
        activityBefore: p.before.activity,
        activityAfter: after.activity,
        limitingBefore: p.before.limiting,
        limitingAfter: after.limiting,
        kind,
        inputs: { ...s.inputs },
      };

      for (const [code, m] of Object.entries(misconceptions)) {
        const tr = m.trigger;
        if (tr.type !== "trial" || misconceptionStatus[code]) continue;
        if (!tr.stages.includes(s.stage) || variable !== tr.variable || to <= p.from) continue;
        if (tr.whenNotLimiting && p.before.limiting.includes(variable)) continue;
        if (tr.firstChangeOnly && trials.some((t) => t.scenarioId === s.scenarioId)) continue;
        misconceptionStatus = { ...misconceptionStatus, [code]: "detected" };
        events = [...events, { type: "misconceptionDetected", code, t: Date.now(), stage: s.stage, scenarioId: s.scenarioId }];
      }

      trials = [...trials, trial];
      const limitingList = kind === "nonLimitingUp" ? p.before.limiting : after.limiting;
      toast = {
        id: trial.id,
        tone: after.activity > p.before.activity ? "up" : after.activity < p.before.activity ? "down" : "flat",
        text: format(guide.changes[kind], {
          Var: VAR_LABEL[variable],
          var: VAR_INLINE[variable],
          from: p.from,
          to,
          aFrom: p.before.activity,
          aTo: after.activity,
          limiting: describeLimiting(limitingList),
          isAre: limitingList.length > 1 ? "are" : "is",
          factor: limitingList.length > 1 ? "factors" : "factor",
        }),
      };
    }

    set({ trials, misconceptionStatus, toast, events, pending: {} });
  },

  resetScenario: () => {
    const s = get();
    set({ ...scenarioState(s.scenarioId), run: s.run + 1, dragging: null });
    get().logEvent("reset");
  },

  submitExplanation: (text) => {
    const result = evaluateRubric(text, rubric.explain.ideas);
    set((s) => ({ explainAttempts: [...s.explainAttempts, { text, result, t: Date.now() }] }));
    get().logEvent("explanation", { requiredMet: result.requiredMet });
    return result;
  },

  submitApplyWhy: (text) => {
    const s = get();
    const result = evaluateRubric(text, rubric.applyWhy.ideas);
    const fixed = Boolean(getApplyFlags(s).fixTrial);
    let misconceptionStatus = s.misconceptionStatus;
    for (const [code, status] of Object.entries(misconceptionStatus)) {
      const clear = misconceptions[code]?.clear;
      if (status !== "detected" || !clear || misconceptions[code].trigger.type !== "trial") continue;
      const ideaMet = !clear.requiresIdea || result.ideas.find((i) => i.id === clear.requiresIdea)?.met;
      if ((!clear.requiresLimitingFix || fixed) && ideaMet) misconceptionStatus = { ...misconceptionStatus, [code]: "cleared" };
    }
    set({ applyWhy: { text, result }, misconceptionStatus });
    get().logEvent("applyWhy", { requiredMet: result.requiredMet });
    return result;
  },

  finish: () => {
    set((s) => ({ stage: "mastery", dragging: null, notebookOpen: false, sheet: { ...s.sheet, open: false } }));
    get().logEvent("finished");
  },
}));

if (import.meta.env.DEV && typeof window !== "undefined") window.__lab = useLabStore;

export function getGuide(state) {
  const g = guide.stages;
  switch (state.stage) {
    case "intro":
      return { text: g.intro };
    case "predict":
      return { text: g.predict };
    case "experiment": {
      const { limitingTrial, nonLimitingTrial, last } = getExperimentFlags(state.trials);
      if (!limitingTrial) return { text: g.experiment.testPrediction, marker: "light" };
      if (last?.kind === "nonLimitingUp") return { text: g.experiment.keyMoment, glow: last.limitingBefore };
      if (last?.kind === "coLimitedUp") return { text: g.experiment.keyMoment, glow: last.limitingAfter };
      if (!nonLimitingTrial) return { text: g.experiment.tryOther, marker: "water" };
      return { text: g.experiment.ready };
    }
    case "zoom": {
      const task = getZoomTask(state);
      if (task === "co2path" && state.co2Path.wrong) return { text: format(g.zoom.wrongPath, { hint: state.co2Path.wrong.hint }) };
      if (task === "coupling" && (couplingTests(state.chloroTrials).co2Off || couplingTests(state.chloroTrials).lightOff))
        return { text: g.zoom.couplingNext };
      if (task === "isotope" && (state.atoms.runs.h2o18 || state.atoms.runs.co2_18)) return { text: g.zoom.isotopeNext };
      return { text: g.zoom[task] };
    }
    case "explain":
      return { text: explainQ1Done(state) ? g.explain2 : g.explain };
    case "challenge": {
      const sum = challengeSummary(state);
      if (sum.passed) return { text: g.challenge.passed };
      if (sum.attempted === sum.results.length) return { text: g.challenge.done };
      const c = currentCase(state);
      const st = caseState(state, c.id);
      if (st.diagnosed) return { text: g.challenge.why };
      if (st.wrong) return { text: st.wrong.hint };
      return { text: format(g.challenge.case, { title: c.title, prompt: c.steps[st.step].prompt }) };
    }
    case "report":
      return { text: g.report };
    case "apply": {
      const flags = getApplyFlags(state);
      if (state.applyWhy?.result.requiredMet) return { text: g.apply.done };
      if (flags.solved) return { text: g.apply.solved };
      if (flags.wrongTrial) return { text: g.apply.wrongFirst, glow: [scenarios.scenarios.B.limiting] };
      return { text: g.apply.start };
    }
    default:
      return { text: "" };
  }
}

export function canLeaveExperiment(state) {
  return Boolean(getExperimentFlags(state.trials).limitingTrial);
}

export function explainQ1Done(state) {
  const last = state.explainAttempts[state.explainAttempts.length - 1];
  return Boolean(last?.result.requiredMet) || state.explainAttempts.length >= 2;
}

export function explainQ2Done(state) {
  const last = state.explain2Attempts[state.explain2Attempts.length - 1];
  return Boolean(last?.result.requiredMet) || state.explain2Attempts.length >= 2;
}
