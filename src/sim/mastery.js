import scenarios from "../data/scenarios.json";
import mastery from "../data/mastery.json";
import misconceptions from "../data/misconceptions.json";
import chapter from "../data/chapter10_2.json";
import { challengeSummary, couplingTests } from "./advancedSlice";

const LABELS = { light: "light", water: "water", co2: "CO₂" };

function upKinds(kind) {
  return kind === "limitingUp" || kind === "limitingUpNewLimit";
}

export function getExperimentFlags(trials) {
  const a = trials.filter((t) => t.scenarioId === "A");
  const limitingTrial = a.find((t) => t.variable === scenarios.scenarios.A.limiting && upKinds(t.kind));
  const nonLimitingTrial = a.find((t) => t.kind === "nonLimitingUp" || t.kind === "coLimitedUp");
  return { limitingTrial, nonLimitingTrial, last: a[a.length - 1] };
}

export function getApplyFlags(state) {
  const b = state.trials.filter((t) => t.scenarioId === "B");
  const scenario = scenarios.scenarios.B;
  const fixTrial = b.find((t) => t.variable === scenario.limiting && t.activityAfter > t.activityBefore);
  const wrongTrial = b.find((t) => t.variable !== scenario.limiting && t.kind === "nonLimitingUp");
  const solved = Boolean(fixTrial) && state.activity >= scenario.goalActivity;
  return { fixTrial, wrongTrial, solved };
}

export function computeMastery(state) {
  const { hypothesis, trials, explainAttempts, applyWhy, misconceptionStatus } = state;
  const exp = getExperimentFlags(trials);
  const app = getApplyFlags(state);
  const lastExplain = explainAttempts[explainAttempts.length - 1];

  const items = {
    prediction: {
      met: hypothesis?.choice === scenarios.predict.correct,
      detail: hypothesis
        ? `You predicted photosynthesis would ${hypothesis.choice === "same" ? "stay the same" : hypothesis.choice} when sunlight increased.`
        : "No prediction was recorded.",
    },
    experiment: {
      met: Boolean(exp.limitingTrial),
      detail: exp.limitingTrial
        ? `You raised light from ${exp.limitingTrial.from} to ${exp.limitingTrial.to} and activity rose from ${exp.limitingTrial.activityBefore} to ${exp.limitingTrial.activityAfter}.` +
          (exp.nonLimitingTrial
            ? ` Raising ${LABELS[exp.nonLimitingTrial.variable]} from ${exp.nonLimitingTrial.from} to ${exp.nonLimitingTrial.to} left activity at ${exp.nonLimitingTrial.activityAfter}.`
            : "")
        : "You have not yet raised the limiting input and watched the activity change.",
    },
    explanation: {
      met: Boolean(lastExplain?.result.requiredMet),
      detail: lastExplain
        ? `Your explanation ${lastExplain.result.ideas
            .filter((i) => i.required)
            .map((i) => `${i.met ? "included" : "did not yet include"} that ${i.label.charAt(0).toLowerCase()}${i.label.slice(1)}`)
            .join(", and ")}.`
        : "No explanation was submitted.",
    },
    application: {
      met: Boolean(app.fixTrial) && Boolean(applyWhy?.result.requiredMet),
      detail: app.fixTrial
        ? `In Greenhouse B you added water (${app.fixTrial.from} → ${app.fixTrial.to}) and activity rose to ${app.fixTrial.activityAfter}.` +
          (applyWhy?.result.requiredMet ? " You explained that water, not light, was limiting." : " Your explanation of why light would not help is still missing the key idea.")
        : "The new plant has not been fixed yet.",
    },
    ...advancedItems(state),
  };

  const explain2 = state.explain2Attempts[state.explain2Attempts.length - 1];
  items.explanation = {
    met: items.explanation.met && Boolean(explain2?.result.requiredMet),
    detail:
      items.explanation.detail +
      (explain2
        ? ` For the chloroplast, you ${explain2.result.ideas
            .filter((i) => i.required)
            .map((i) => `${i.met ? "explained" : "did not yet explain"} that ${lower(i.label)}`)
            .join(", ")}.`
        : " The chloroplast question has not been answered."),
  };

  const evidence = mastery.evidence.map((e) => ({ ...e, ...items[e.id] }));
  const metCount = evidence.filter((e) => e.met).length;
  const unresolved = Object.entries(misconceptionStatus)
    .filter(([, status]) => status === "detected")
    .map(([code]) => ({ code, ...misconceptions[code] }));
  const corrected = Object.entries(misconceptionStatus)
    .filter(([, status]) => status === "cleared")
    .map(([code]) => ({ code, ...misconceptions[code] }));

  let level = "developing";
  if (metCount === evidence.length && unresolved.length === 0) level = "mastered";
  else if (unresolved.length > 1 || metCount <= evidence.length / 2 - 1) level = "retry";

  return { level, ...mastery.levels[level], concept: mastery.concept, evidence, unresolved, corrected };
}

function lower(label) {
  return label.charAt(0).toLowerCase() + label.slice(1);
}

function advancedItems(state) {
  const { co2Path, chloroTrials, whatIf, atoms } = state;
  const tests = couplingTests(chloroTrials);
  const challenge = challengeSummary(state);
  const structures = chapter.zoom.structures;

  const predicted = whatIf
    ? chapter.whatIf.predictions.map((p, i) => {
        const series = p.series.split(" (")[0];
        return `${i > 0 && /^[A-Z][a-z]/.test(series) ? lower(series) : series} would ${whatIf[p.id]?.choice === "same" ? "stay the same" : whatIf[p.id]?.choice}`;
      }).join(" and ")
    : null;

  return {
    sites: {
      met: co2Path.done && state.maxZoomLevel >= 3,
      detail: co2Path.done
        ? `You traced CO₂: ${co2Path.picked.map((id) => structures[id].toLowerCase()).join(" → ")}, then zoomed through a mesophyll cell into a chloroplast${state.maxZoomLevel >= 3 ? " and its two stages" : ""}.`
        : `You placed ${co2Path.picked.length} of 4 steps of the CO₂ path.`,
    },
    stages: {
      met: Boolean(whatIf && tests.co2Off && tests.lightOff),
      detail:
        (predicted ? `You predicted ${predicted}. ` : "No WHAT IF prediction was recorded. ") +
        (tests.co2Off ? `With CO₂ removed, O₂ release fell ${tests.co2Off.before.o2} → ${tests.co2Off.after.o2} while ATP piled up to ${tests.co2Off.after.atp}%. ` : "") +
        (tests.lightOff ? `With the light off, sugar output fell ${tests.lightOff.before.sugar} → ${tests.lightOff.after.sugar}.` : "") +
        (!tests.co2Off || !tests.lightOff ? " Both tests are needed." : ""),
    },
    atoms: {
      met: Boolean(atoms.runs.h2o18 && atoms.runs.co2_18 && atoms.ledgerDone),
      detail:
        (atoms.hypothesis ? `You first supported ${atoms.hypothesis === "water" ? "van Niel’s water-splitting hypothesis" : "the CO₂-splitting hypothesis"}. ` : "") +
        `${Object.keys(atoms.runs).length} of 2 ¹⁸O experiments run` +
        (atoms.runs.h2o18 ? " (the label reached O₂ only from H₂O)" : "") +
        (atoms.ledgerDone ? "; every atom placed in Figure 10.4." : "; the atom ledger is not complete."),
    },
    challenge: {
      met: challenge.passed,
      detail: `${challenge.solved} of ${challenge.results.length} mystery chloroplasts diagnosed and justified${challenge.results
        .filter((r) => r.state.solved)
        .map((r) => ` · ${r.title.split(" · ")[1]}`)
        .join("")}.`,
    },
  };
}
