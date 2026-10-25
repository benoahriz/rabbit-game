// calendar.test.js — month grid structure + scene pick (pure; no DOM).
import test from "node:test";
import assert from "node:assert";
import { monthMatrix, sceneForHour } from "../scripts/calendar.js";

test("every month lays out as Sunday-start weeks of 7 cells", () => {
  for (const [y, m] of [[2026, 9], [2027, 0], [2024, 1], [2026, 11]]) { // Oct'26, Jan'27, Feb'24 (leap), Dec'26
    const { weeks } = monthMatrix(y, m);
    assert.ok(weeks.length === 5 || weeks.length === 6, `${y}-${m} week count`);
    for (const w of weeks) assert.equal(w.length, 7);
  }
});

test("first day cell matches the real weekday and days are ordered", () => {
  for (const [y, m] of [[2026, 9], [2027, 2]]) {
    const { weeks } = monthMatrix(y, m);
    const flat = weeks.flat();
    const firstIdx = flat.findIndex((c) => c !== null);
    assert.equal(firstIdx, new Date(y, m, 1).getDay());
    const days = flat.filter((c) => c !== null);
    const expected = new Date(y, m + 1, 0).getDate();
    assert.equal(days.length, expected);
    assert.deepEqual(days, [...days].sort((a, b) => a - b));
  }
});

test("label is human month + year", () => {
  assert.equal(monthMatrix(2026, 9).label, "October 2026");
});

// --- time-of-day scene pick (IDEA-018): Casey's world follows the real day ---
test("sceneForHour: day / golden hour / night boundaries", () => {
  for (const h of [6, 9, 12, 15, 16]) assert.equal(sceneForHour(h), "day", `${h}:00 is day`);
  for (const h of [17, 18, 19]) assert.equal(sceneForHour(h), "sunset", `${h}:00 is golden hour`);
  for (const h of [20, 21, 23, 0, 3, 5]) assert.equal(sceneForHour(h), "night", `${h}:00 is night`);
});
