// tests/rabbit-state.test.js — FSM behavior with an injectable fake clock.
import test from "node:test";
import assert from "node:assert";
import { RabbitState, AMBIENT, isMilestone } from "../scripts/rabbit-state.js";

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

// --- pet-quality + perk (IDEA-001 / IDEA-005, 2026-10-24) ---
test("pet(quality) scales heat: default stays exactly 1 like v0.1", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now });
  r.update(0);
  r.pet();
  assert.equal(r.petHeat, 1);
});

test("pet(quality): sweet-spot strokes melt her faster, slow ones gently", () => {
  const ckA = fakeClock(), ckB = fakeClock();
  const a = new RabbitState({ now: () => ckA.now });
  const b = new RabbitState({ now: () => ckB.now });
  a.update(0); b.update(0);
  a.pet(1);    // perfect scritch
  b.pet(0.35); // very slow
  assert.equal(a.petHeat, 1.5);
  assert.ok(b.petHeat < 1, "gentle pets still accumulate, just slower");
});

test("perk(): idle ear twitch with cooldown; never during other states", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now });
  r.update(0);
  assert.equal(r.perk(), true);
  assert.ok(r.earStart >= 0, "ear window opened");
  assert.equal(r.perk(), false, "cooldown blocks an immediate second perk");
  ck.advance(3000);
  assert.equal(r.perk(), true, "cooldown passed");
  r.feed(); // eating
  ck.advance(3000);
  assert.equal(r.perk(), false, "no perk while eating");
});

// --- fed milestones (IDEA-014): celebrations, never streak pressure ---
test("isMilestone: exactly the celebration numbers", () => {
  for (const n of [10, 25, 50, 100, 200, 300]) assert.equal(isMilestone(n), true, `${n} celebrates`);
  for (const n of [0, 1, 7, 9, 11, 24, 26, 33, 99, 101, 150]) assert.equal(isMilestone(n), false, `${n} is an ordinary day`);
});

// --- dozing (IDEA-017): sleeps after long idle, wakes on any interaction ---
test("dozes after dozeAfterMs of quiet idle; wakes on feed/pet", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now, dozeAfterMs: 300 });
  r.update(0);
  assert.equal(r.dozing, false);
  ck.advance(299);
  r.update(0);
  assert.equal(r.dozing, false, "not yet");
  ck.advance(2);
  r.update(0);
  assert.equal(r.dozing, true, "idle long enough → dozing");
  r.feed();
  assert.equal(r.dozing, false, "feeding wakes her");
  ck.advance(100);
  r.pet(); // a pat during eating is a harmless heat tick — the chomp owns the state
  assert.equal(r.dozing, false);
  assert.equal(r.state, "eating", "a pat during eating doesn't interrupt the chomp");
  ck.advance(2200); // past EAT_MS → idle again, and quiet long past dozeAfterMs
  r.update(0);
  assert.equal(r.dozing, true, "dozes again after the quiet spell");
  r.perk();
  assert.equal(r.dozing, false, "the pointer arriving wakes her gently");
});

test("no dozing mid-chomp (activity resets the quiet clock)", () => {
  const ck = fakeClock();
  const r = new RabbitState({ now: () => ck.now, dozeAfterMs: 200 });
  r.update(0);
  r.feed();
  ck.advance(200); // long past dozeAfterMs, but she is still eating
  r.update(0);
  assert.equal(r.state, "eating");
  assert.equal(r.dozing, false, "no dozing mid-chomp");
  ck.advance(1600); // eating ends → idle; quiet elapsed since the feed → dozes
  r.update(0);
  assert.equal(r.dozing, true);
});
