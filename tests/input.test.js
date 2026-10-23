// tests/input.test.js — pure gesture classification (no DOM).
import test from "node:test";
import assert from "node:assert";
import { classifyStroke, pointInRect } from "../scripts/input.js";

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
