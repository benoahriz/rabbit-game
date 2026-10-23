// rabbit-game v0.1 — tiny persistence (PRD §6.2): { muted, fed } in localStorage.
// Injected storage keeps it testable; private-mode failures degrade to in-memory only.

const KEY = "rabbit-game:v1";

export class Store {
  constructor(storage) {
    this.storage = storage ?? null; // pass globalThis.localStorage at call site
    this.data = { muted: false, fed: 0 };
    this.load();
  }

  load() {
    try {
      const raw = this.storage?.getItem?.(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.muted === "boolean") this.data.muted = parsed.muted;
        if (Number.isFinite(parsed.fed) && parsed.fed >= 0) this.data.fed = Math.floor(parsed.fed);
      }
    } catch { /* fail closed: defaults are fine */ }
    return this.data;
  }

  save(patch = {}) {
    Object.assign(this.data, patch);
    try { this.storage?.setItem?.(KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
    return this.data;
  }
}
