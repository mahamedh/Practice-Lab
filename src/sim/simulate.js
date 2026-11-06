export const VARIABLES = ["light", "water", "co2"];

export function clampInput(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function simulate(inputs) {
  const activity = Math.min(inputs.light, inputs.water, inputs.co2);
  const limiting = activity >= 100 ? [] : VARIABLES.filter((key) => inputs[key] === activity);
  return { activity, limiting, health: activity / 100 };
}

export function classifyChange({ variable, from, to, before, after }) {
  const delta = to - from;
  const activityDelta = after.activity - before.activity;
  const wasLimiting = before.limiting.includes(variable);
  if (delta > 0) {
    if (activityDelta > 0 && wasLimiting) {
      const stillLimiting = after.limiting.length === 0 || after.limiting.includes(variable);
      return stillLimiting ? "limitingUp" : "limitingUpNewLimit";
    }
    if (activityDelta === 0) return wasLimiting ? "coLimitedUp" : "nonLimitingUp";
    return "limitingUp";
  }
  if (delta < 0) {
    if (activityDelta < 0 && after.limiting.includes(variable)) return "becameLimiting";
    return activityDelta === 0 ? "noChange" : "down";
  }
  return "noChange";
}
