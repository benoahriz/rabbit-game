// tests/rabbit-state.test.js — FSM behavior with an injectable fake clock.
import test from "node:test";
import assert from "node:assert";
import { RabbitState, AMBIENT } from "../scripts/rabbit-state.js";

function fakeClock() {
  let t = 1000;
  return {
    get now() { return t; },
    advance(ms) { t += ms; },
  };
}

test("feed starts eating, counts, then returns to idle", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now });
  const ev = r.feed();
  assert.equal(ev.noise, "munch");
  assert.equal(r.fed, 1);
  assert.equal(r.state, "eating");
  ck.advance(AMBIENT.EAT_MS + 1);
  r.update(0);
  assert.equal(r.state, "idle");
});

test("rapid re-feed sets the hiccup flag (cute, never punishing)", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now });
  r.feed();
  const ev2 = r.feed();
  assert.equal(ev2.hiccup, true);
  ck.advance(AMBIENT.RAPID_FEED_MS + 1);
  const ev3 = r.feed();
  assert.equal(ev3.hiccup, false);
});

test("three pets trigger a happy chirrup, then idle", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now });
  assert.equal(r.pet().noise, "soft");
  assert.equal(r.pet().noise, "soft");
  const ev = r.pet();
  assert.equal(ev.noise, "chirrup");
  assert.equal(r.state, "happy");
  assert.equal(r.petHeat, 0);
  ck.advance(AMBIENT.HAPPY_MS + 1);
  r.update(0);
  assert.equal(r.state, "idle");
});

test("pet heat decays toward zero over time", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now });
  r.pet(); r.pet();
  assert.ok(r.petHeat >= 2);
  ck.advance(0); r.update(5); // 5 seconds decay
  assert.equal(r.petHeat, 0);
});

test("blink ramps 0→(peak)→0 within BLINK_MS", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now });
  r.blinkAt = ck.now; // force an immediate blink
  r.update(0);
  assert.ok(r.blink() >= 0 && r.blink() <= 1);
  ck.advance(AMBIENT.BLINK_MS / 2);
  r.update(0);
  assert.ok(r.blink() > 0.9, "midway blink ≈ closed");
  ck.advance(AMBIENT.BLINK_MS);
  r.update(0);
  assert.equal(r.blink(), 0, "blink finished");
});
