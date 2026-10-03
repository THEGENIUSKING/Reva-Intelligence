export function parseModelObject(text) {
  const value = JSON.parse(String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Model output must be a JSON object.");
  }
  return value;
}

export function boundedScore(value, maximum = 100) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(maximum, score)) : 0;
}
