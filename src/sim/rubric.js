function normalize(text) {
  return ` ${text.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ")} `;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPhrase(text, phrase) {
  return new RegExp(`(^|[^a-z])${escapeRegExp(phrase.toLowerCase())}`).test(text);
}

export function evaluateRubric(text, ideas) {
  const normalized = normalize(text || "");
  const results = ideas.map((idea) => ({
    id: idea.id,
    label: idea.label,
    required: idea.required,
    hint: idea.hint,
    met: idea.groups.every((group) => group.some((phrase) => hasPhrase(normalized, phrase))),
  }));
  const missingRequired = results.filter((r) => r.required && !r.met);
  return {
    ideas: results,
    requiredMet: missingRequired.length === 0,
    hint: missingRequired[0]?.hint || results.find((r) => !r.met)?.hint || null,
  };
}
