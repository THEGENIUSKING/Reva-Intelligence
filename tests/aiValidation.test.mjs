import test from "node:test";
import assert from "node:assert/strict";
import { boundedScore, parseModelObject } from "../convex/aiValidation.js";

test("accepts a fenced JSON object returned by the model", () => {
  assert.deepEqual(parseModelObject('```json\n{"score":72}\n```'), { score: 72 });
});

test("rejects malformed JSON and non-object model responses", () => {
  assert.throws(() => parseModelObject("not json"));
  assert.throws(() => parseModelObject("[1,2]"), /JSON object/);
  assert.throws(() => parseModelObject("null"), /JSON object/);
});

test("clamps model scores to the allowed range", () => {
  assert.equal(boundedScore(120), 100);
  assert.equal(boundedScore(-4), 0);
  assert.equal(boundedScore("62.5"), 62.5);
  assert.equal(boundedScore("unknown"), 0);
  assert.equal(boundedScore(18, 20), 18);
});
