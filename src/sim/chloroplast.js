// Two-module chloroplast model (Figure 10.5).
// Pools are fractions: atp (ADP = 1 - atp) and nadph (NADP+ = 1 - nadph).
// Light reactions need light plus ADP and NADP+; the Calvin cycle needs CO2 plus ATP and NADPH.

const K_LIGHT = 25;
const K_CO2 = 20;
const K_LR = 2.0;
const K_CC = 2.0;
const NADPH_SHARE = 0.8;

export function saturation(x, k) {
  const v = Math.max(0, x);
  return (v / (v + k)) * ((100 + k) / 100);
}

export function rates(state, inputs) {
  const light = K_LR * saturation(inputs.light, K_LIGHT) * (1 - state.atp) * (1 - state.nadph);
  const calvin = K_CC * saturation(inputs.co2, K_CO2) * state.atp * state.nadph;
  return { light, calvin };
}

export function step(state, inputs, dt) {
  let { atp, nadph } = state;
  const sub = Math.max(1, Math.ceil(dt / (1 / 60)));
  const h = dt / sub;
  for (let i = 0; i < sub; i++) {
    const r = rates({ atp, nadph }, inputs);
    atp = clamp01(atp + (r.light - r.calvin) * h);
    nadph = clamp01(nadph + NADPH_SHARE * (r.light - r.calvin) * h);
  }
  return { atp, nadph };
}

export function steadyState(inputs, seconds = 40) {
  let s = { atp: 0.5, nadph: 0.5 };
  for (let t = 0; t < seconds; t += 0.05) s = step(s, inputs, 0.05);
  return s;
}

const REF = (() => {
  const full = { light: 100, co2: 100 };
  return rates(steadyState(full), full);
})();

export function outputs(state, inputs) {
  const r = rates(state, inputs);
  const lr = (r.light / REF.light) * 100;
  const usesWater = inputs.hSource !== "H2S";
  return {
    o2: usesWater ? lr : 0,
    s: usesWater ? 0 : lr,
    lightRate: lr,
    sugar: (r.calvin / REF.calvin) * 100,
    atp: state.atp * 100,
    nadph: state.nadph * 100,
  };
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// Mutable runtime shared by the 3D driver, the readout and the store.
export const chloroRuntime = {
  state: { atp: 0.5, nadph: 0.5 },
  t: 0,
  out: { o2: 0, s: 0, sugar: 0, atp: 50, nadph: 50, lightRate: 0 },
  history: [],
  lastSample: -1,
};

const SAMPLE_DT = 0.1;
const HISTORY_MAX = 600;

export function resetRuntime(inputs) {
  chloroRuntime.state = steadyState(inputs);
  chloroRuntime.t = 0;
  chloroRuntime.history = [];
  chloroRuntime.lastSample = -1;
  chloroRuntime.out = outputs(chloroRuntime.state, inputs);
  sample();
}

export function advance(inputs, dt) {
  chloroRuntime.state = step(chloroRuntime.state, inputs, Math.min(dt, 0.1));
  chloroRuntime.t += Math.min(dt, 0.1);
  chloroRuntime.out = outputs(chloroRuntime.state, inputs);
  if (chloroRuntime.t - chloroRuntime.lastSample >= SAMPLE_DT) sample();
}

function sample() {
  const o = chloroRuntime.out;
  chloroRuntime.lastSample = chloroRuntime.t;
  chloroRuntime.history.push({ t: chloroRuntime.t, o2: o.o2, s: o.s, atp: o.atp, nadph: o.nadph, sugar: o.sugar });
  if (chloroRuntime.history.length > HISTORY_MAX) chloroRuntime.history.shift();
}

export function snapshot() {
  const o = chloroRuntime.out;
  return { o2: round(o.o2), s: round(o.s), sugar: round(o.sugar), atp: round(o.atp), nadph: round(o.nadph) };
}

function round(v) {
  return Math.round(v);
}
