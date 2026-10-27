// rabbit-game v0.1 — rabbit behavior FSM (pure module, no DOM; tested by node --test in tests/).
// The rabbit never "demands": idle chatter is delight, not need (PRD §8 Non-Goals).

export const AMBIENT = {  EAT_MS: 1600,          // eating animation duration
  HAPPY_MS: 2000,        // happy wiggle duration
  RAPID_FEED_MS: 900,    // feeding again within this = hiccup (cute, not punishing)
  BLINK_EVERY: [2600, 5200], // random blink interval range (ms)
  BLINK_MS: 180,
  EAR_MS: 1200,          // ear twitch duration
  PET_THRESHOLD: 3,      // accumulated pet heat that triggers a happy hop
  PET_DECAY_PER_S: 0.6,  // pet heat decay per second (head-only strokes accumulate slower than full-body did)
  MIN_STROKE: 28,        // pointer travel that turns a touch into a stroke (px)
  DOZE_AFTER_MS: 60000,  // idle minute before Casey dozes off (IDEA-017; any interaction wakes her — tuned 2026-10-27, was 3 min)
};

/** Fed-count milestones (IDEA-014): one-shot celebrations, never streak pressure. */
export function isMilestone(fed) {
  return fed === 10 || fed === 25 || fed === 50 || fed === 100 ||
    (fed > 100 && fed % 100 === 0);
}

export class RabbitState {
  constructor({ now = () => performance.now(), fed = 0, dozeAfterMs = AMBIENT.DOZE_AFTER_MS } = {}) {
    this.now = now;
    this.fed = fed;
    this.dozeAfterMs = dozeAfterMs; // injectable for tests
    this.state = "idle";          // idle | eating | happy
    this.animStart = this.now();  // when the current state was entered (drives animations)
    this.petHeat = 0;             // accumulates pet ticks; decays over time
    this.lastFeedAt = -1e9;
    this.hiccup = false;
    const t = this.now();
    const [blinkLo, blinkHi] = AMBIENT.BLINK_EVERY;
    this.blinkAt = t + blinkLo + Math.random() * (blinkHi - blinkLo);
    this.blinkStart = -1;
    this.earAt = t + 3500;
    this.earStart = -1;
    this.earSide = 0;
    this.dozing = false;       // IDEA-017: idle long enough and she naps (no demand — sleeping is state, not guilt)
    this._lastAwakeAt = t;
  }

  /** Any interaction gently wakes her (IDEA-017). */
  wake() {
    this.dozing = false;
    this._lastAwakeAt = this.now();
  }

  /** Feed a carrot. Returns the noise event to play. */
  feed() {
    const t = this.now();
    this.wake();
    this.hiccup = t - this.lastFeedAt < AMBIENT.RAPID_FEED_MS;
    this.lastFeedAt = t;
    this.fed += 1;
    this.state = "eating";
    this.animStart = t;
    return { noise: "munch", hiccup: this.hiccup };
  }

  /**
   * One pet tick (stroke chunk or gentle tap). Returns the noise event to play.
   * quality: 0..1 stroke grade (IDEA-001 — pet well and she melts); default 0.5
   * keeps the increment at exactly 1 heat (backward-compatible with v0.1).
   */
  pet(quality = 0.5) {
    const t = this.now();
    this.wake();
    const inc = 0.5 + quality; // default 0.5 → exactly 1 heat (v0.1-compatible); perfect scritch → 1.5
    if (this.state === "happy" || this.petHeat + inc >= AMBIENT.PET_THRESHOLD) {
      this.petHeat = 0;
      this.state = "happy";
      this.animStart = t;
      return { noise: "chirrup" };
    }
    this.petHeat += inc;
    return { noise: "soft" };
  }

  /**
   * Casey notices the pointer arriving near her (IDEA-005): force one ear
   * twitch while idle, cooldown-gated so she never spasms. Returns whether
   * the perk fired (callers add the soft chirp + bubble).
   */
  perk() {
    const t = this.now();
    this.wake(); // the pointer arriving near her is a gentle wake (IDEA-005 + IDEA-017)
    if (this.state !== "idle" || t - (this._lastPerk ?? -1e9) < 2500) return false;
    this._lastPerk = t;
    this.earStart = t;
    this.earSide = Math.random() < 0.5 ? -1 : 1;
    return true;
  }

  /** Advance timers. dt = seconds since previous update (0 is fine). */
  update(dt = 0) {
    const t = this.now();

    if (this.state === "eating" && t - this.animStart >= AMBIENT.EAT_MS) {
      this.state = "idle"; this.animStart = t;
    }
    if (this.state === "happy" && t - this.animStart >= AMBIENT.HAPPY_MS) {
      this.state = "idle"; this.animStart = t;
    }

    // blink (0→1→0 bump over BLINK_MS)
    if (this.blinkStart >= 0) {
      if (t - this.blinkStart >= AMBIENT.BLINK_MS) this.blinkStart = -1;
    } else if (t >= this.blinkAt) {
      this.blinkStart = t;
      const [lo, hi] = AMBIENT.BLINK_EVERY;
      this.blinkAt = t + lo + Math.random() * (hi - lo);
    }

    // ear twitch (occasional, random side)
    if (this.earStart >= 0) {
      if (t - this.earStart >= AMBIENT.EAR_MS) this.earStart = -1;
    } else if (t >= this.earAt) {
      this.earStart = t;
      this.earSide = Math.random() < 0.5 ? -1 : 1;
      this.earAt = t + 4000 + Math.random() * 5000;
    }

    // stroking regularly keeps petHeat alive; it decays otherwise
    this.petHeat = Math.max(0, this.petHeat - AMBIENT.PET_DECAY_PER_S * dt);

    // dozing: idle + quiet long enough (IDEA-017); feeding/petting/perking all wake her
    if (this.state === "idle" && !this.dozing && t - this._lastAwakeAt >= this.dozeAfterMs) {
      this.dozing = true;
    }
    return this;
  }

  // ---- read-only animation parameters for the renderer ----
  age() { return this.now() - this.animStart; }

  /** 0..1 blink amount (1 = lids closed). */
  blink() {
    if (this.blinkStart < 0) return 0;
    const p = Math.min(1, Math.max(0, (this.now() - this.blinkStart) / AMBIENT.BLINK_MS));
    return Math.sin(p * Math.PI);
  }

  /** -1..1 ear twitch amount for this frame. */
  earTwitch() {
    if (this.earStart < 0) return 0;
    const p = (this.now() - this.earStart) / AMBIENT.EAR_MS;
    return Math.sin(p * Math.PI * 3) * this.earSide;
  }

  /** 0..1 progress through the current one-shot animation (0 when idle). */
  progress() {
    if (this.state === "eating") return Math.min(1, this.age() / AMBIENT.EAT_MS);
    if (this.state === "happy") return Math.min(1, this.age() / AMBIENT.HAPPY_MS);
    return 0;
  }
}
