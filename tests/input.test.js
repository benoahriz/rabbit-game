// tests/input.test.js — pure gesture classification (no DOM).
import test from "node:test";
import assert from "node:assert";
import { classifyStroke, pointInRect, petGrade } from "../scripts/input.js";

test("single sample = tap", () => {
  assert.equal(classifyStroke([{ x: 1, y: 1, t: 0 }]), "tap");
});

test("short travel = tap, long travel = pet", () => {
  const tiny = [
    { x: 0, y: 0, t: 0 },
    { x: 3, y: 2, t: 5 },
  ];
  assert.equal(classifyStroke(tiny, { MIN_STROKE: 28 }), "tap");

  const stroke = Array.from({ length: 30 }, (_, i) => ({ x: i * 2, y: 0, t: i }));
  assert.equal(classifyStroke(stroke, { MIN_STROKE: 28 }), "pet");
});

test("empty/null strokes classify to null", () => {
  assert.equal(classifyStroke([]), null);
  assert.equal(classifyStroke(null), null);
});

test("pointInRect hit-testing", () => {
  const r = { x: 10, y: 10, w: 100, h: 80 };
  assert.equal(pointInRect(50, 50, r), true);
  assert.equal(pointInRect(10, 10, r), true, "corner inclusive");
  assert.equal(pointInRect(9, 50, r), false);
  assert.equal(pointInRect(50, 50, null), false);
});

// --- pet-stroke quality (IDEA-001): sweet-spot curve, never punishing ---
test("petGrade: sweet spot reads as the perfect scritch", () => {
  assert.equal(petGrade(0.5), 1);
  assert.equal(petGrade(0.25), 1);
  assert.equal(petGrade(0.9), 1);
});

test("petGrade: slow is gentle, fast is tickly — never 0, never negative", () => {
  assert.ok(petGrade(0.1) < 1 && petGrade(0.1) >= 0.35, "slow pets still count");
  assert.ok(petGrade(3) >= 0.6 && petGrade(3) < 1, "fast pets stay excited, not bad");
  assert.ok(petGrade(20) >= 0.6, "even wild pats stay positive");
});

test("petGrade: unknown/still pointer is a neutral-gentle default", () => {
  assert.equal(petGrade(0), 0.55);
  assert.equal(petGrade(-1), 0.55);
});
