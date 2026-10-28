// tests/store.test.js — persistence with an injected storage (no browser required).
import test from "node:test";
import assert from "node:assert";
import { Store } from "../scripts/store.js";

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  };
}

test("defaults when storage is empty", () => {
  const s = new Store(fakeStorage());
  assert.deepEqual(s.data, { muted: false, fed: 0, setting: "room", clock: false, captions: false, met: false });
});

test("saves and reloads state across instances", () => {
  const storage = fakeStorage();
  new Store(storage).save({ muted: true, fed: 7, setting: "garden", clock: true, captions: true, met: true });
  const s = new Store(storage);
  assert.equal(s.data.muted, true);
  assert.equal(s.data.fed, 7);
  assert.equal(s.data.setting, "garden");
  assert.equal(s.data.clock, true);
  assert.equal(s.data.captions, true);
  assert.equal(s.data.met, true);
});

test("rejects corrupt/negative data harmlessly", () => {
  const storage = fakeStorage();
  storage.setItem("rabbit-game:v1", "{not json");
  assert.deepEqual(new Store(storage).data, { muted: false, fed: 0, setting: "room", clock: false, captions: false, met: false });

  const storage2 = fakeStorage();
  storage2.setItem("rabbit-game:v1", JSON.stringify({ fed: -3, muted: 42, setting: "castle", clock: "yes", captions: "no", met: 1 }));
  assert.deepEqual(new Store(storage2).data, { muted: false, fed: 0, setting: "room", clock: false, captions: false, met: false });
});

test("works without storage (private mode) — in-memory only", () => {
  const s = new Store(null);
  s.save({ fed: 2 });
  assert.equal(s.data.fed, 2);
});
