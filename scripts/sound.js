// rabbit-game v0.1 — synthesized cute noises (WebAudio). No audio files in v1 (Q-004).
// Fails closed and quiet: a missing/blocked AudioContext never breaks gameplay.
// lean-ctx ceiling: oscillator blips; upgrade to recorded SFX only via the art pipeline (Q-004 option B).

// rabbit-game v0.2 — synthesized cute noises + Casey's voice lines (WebAudio; no ambience bed since 2026-10-28).

/**
 * Casey's voice lines (Q-018, user-supplied AIF exports 2026-10-27, converted to
 * AAC-256 via afconvert and promoted to assets/audio/). These are EVENT pieces —
 * she speaks at the moments her lines name; the instant synth (munch/chirrup/
 * soft/purr) keeps the ≤100ms response layer and stays the fallback whenever a
 * clip is missing.
 */
const CLIPS = {
  hello: "assets/audio/hi-im-casey.m4a",                  // 1.5s — the first-ever meeting
  shy: "assets/audio/i-can-be-shy.m4a",                   // 1.8s — the first time she notices you
  eatLine: "assets/audio/im-only-eating-at-my-house.m4a", // 1.7s — occasionally while eating
  ask: "assets/audio/petmeandfeedme.m4a",                 // 2.6s — her rare idle hum
  greet: "assets/audio/seeyouagain.m4a",                  // 2.9s — when you come back
  // the petting pool (2026-10-28): short noises she makes while being petted —
  // a light sprinkle of these voices the per-tick layer
  pet1: "assets/audio/petting-1.m4a",
  pet3: "assets/audio/petting-3.m4a",
  pet5: "assets/audio/petting-5.m4a",
  // the eating set (2026-10-28, later drop): real chewing + the post-meal coin-flip
  chew: "assets/audio/chewing.m4a",            // 3.5s — replaces the synth crunches when loaded
  more: "assets/audio/feed-me-more.m4a",       // 1.1s — she wants another
  yummy: "assets/audio/thats-yummy.m4a",       // 1.5s — she's satisfied
};
const PETTING_POOL = ["pet1", "pet3", "pet5"];
const POST_EAT_POOL = ["yummy", "more"];

export class SoundEngine {
  constructor({ getMuted = () => false } = {}) {
    this.ctx = null;          // created lazily on first user gesture (autoplay policy)
    this.master = null;
    this.getMuted = getMuted;
    this.lastChirrup = 0;
    this._purring = false;   // continuous purr state (IDEA-013)
    this._purrNodes = null;
    this.clips = {};              // decoded voice lines (Q-018); missing ones degrade to synth
    this._playingClips = new Set(); // a line never restarts while playing
    this._hiddenTimer = null;     // (kept for future farewell scheduling)
    this._hiddenAt = 0;
    this._clipsLoaded = false;
  }

  /** Must be called from a user-gesture handler (browser autoplay policy). Idempotent. */
  unlock() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      return true;
    } catch {
      this.ctx = null; // fail closed
      return false;
    }
  }

  _blip({ freq, to = freq, dur = 0.12, type = "sine", vol = 0.14, when = 0 }) {
    if (!this.ctx || this.getMuted()) return;
    // Feel rule #4 (ADOPT-20261023 / IDEA-008): small detune+gain jitter keeps repeats alive
    const det = 1 + (Math.random() * 2 - 1) * 0.05;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * det, t0);
    if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to * det, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol * (0.85 + Math.random() * 0.3), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  }

  /** Short filtered noise burst (crunchy munch). */
  _crunch(when = 0) {
    if (!this.ctx || this.getMuted()) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * 0.06);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700 + Math.random() * 400;
    bp.Q.value = 1.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t0);
  }

  /** Happier eating: three crunches + tiny swallow blip (spacing/level jitter per IDEA-008). */
  munch() {
    if (!this.ctx || this.getMuted()) return;
    let when = 0;
    for (let i = 0; i < 3; i++) {
      this._crunch(when);
      when += 0.11 + (Math.random() * 2 - 1) * 0.02;
    }
    this._blip({ freq: 520, to: 430, dur: 0.09, vol: 0.07, when: when + 0.16 });
  }

  /** Content rising two-tone (petting a happy rabbit). Min gap so it never annoys. */
  chirrup(now = performance.now()) {
    if (now - this.lastChirrup < 800) return;
    this.lastChirrup = now;
    this._blip({ freq: 640, to: 830, dur: 0.11, vol: 0.13, when: 0 });
    this._blip({ freq: 880, to: 990, dur: 0.09, vol: 0.10, when: 0.11 });
  }

  /** Very soft blip (small pet tick / idle acknowledgments, kept non-annoying). */
  soft() {
    this._blip({ freq: 780, to: 760, dur: 0.06, vol: 0.05, when: 0 });
  }

  /**
   * Continuous soft purr while being petted (IDEA-013): looped noise bed through a
   * low-pass, ramped in/out so starts and stops never click. Idempotent per call —
   * drive it every frame with the pet-heat state. Mute and tab-hidden both silence it
   * (master gain + context suspend).
   */
  setPurr(on) {
    if (!this.ctx || this._purring === !!on) return;
    if (on && !this.getMuted()) {
      this._purring = true;
      const t0 = this.ctx.currentTime;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.round(sr * 1.2), sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 260; // felt more than heard — a chest rumble, not a hiss
      lp.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.value = 0.0001;
      src.connect(lp); lp.connect(g); g.connect(this.master);
      src.start(t0);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.5);
      this._purrNodes = { src, g };
    } else {
      this._purring = false;
      const n = this._purrNodes;
      if (n) {
        this._purrNodes = null;
        try {
          const t0 = this.ctx.currentTime;
          n.g.gain.cancelScheduledValues(t0);
          n.g.gain.setValueAtTime(Math.max(n.g.gain.value, 0.0001), t0);
          n.g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
          n.src.stop(t0 + 0.7);
        } catch { /* already stopped */ }
      }
    }
  }

  // ---- ambient cozy trickling water ---- REMOVED 2026-10-28 (user direction: the
  // background bed is gone; Casey's voice lines + the synth SFX carry the soundscape)

  /** Battery courtesy: no audio while the tab is backgrounded. */
  /**
   * Fetch + decode the promoted voice lines at boot (Q-018). Own-file fetches only
   * (the page's own static files — constitution-clean). A missing/failing clip
   * degrades that moment to the synth fallback; decoding works before the audio
   * unlock because a suspended context can still decode.
   */
  async loadClips() {
    if (this._clipsLoaded) return;
    this._clipsLoaded = true; // one attempt per session; keep boot quiet and cheap
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const dc = this.ctx ?? (AC ? new AC() : null); // suspended scratch context for decoding
      if (!dc) return;
      for (const [name, src] of Object.entries(CLIPS)) {
        try {
          const res = await fetch(src);
          if (!res.ok) continue;
          this.clips[name] = await dc.decodeAudioData(await res.arrayBuffer());
        } catch { /* clip unavailable → that moment falls back to synth */ }
      }
    } catch { /* never breaks boot */ }
  }

  /**
   * Play one of Casey's voice lines. Returns true when the line is handled
   * (played, or already playing — a line never restarts mid-word); false means
   * "not available" and callers use their synth/bubble fallback.
   */
  playClip(name, vol = 0.9) {
    if (!this.ctx || this.getMuted()) return false;
    const buf = this.clips[name];
    if (!buf) return false;
    if (this._playingClips.has(name)) return true;
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.value = vol;
    src.connect(g); g.connect(this.master);
    src.start();
    this._playingClips.add(name);
    src.onended = () => this._playingClips.delete(name);
    return true;
  }

  /** A random petting-pool name that has actually loaded, or null (caller stays synth). */
  petNoise() {
    const available = PETTING_POOL.filter((n) => this.clips[n]);
    return available.length ? available[(Math.random() * available.length) | 0] : null;
  }

  /** A random post-meal line ("yummy" or "more"), or null. */
  postEatNoise() {
    const available = POST_EAT_POOL.filter((n) => this.clips[n]);
    return available.length ? available[(Math.random() * available.length) | 0] : null;
  }

  setHidden(hidden) {
    if (!this.ctx) return false;
    if (hidden) {
      this._hiddenAt = performance.now();
      this.ctx.suspend().catch(() => {});
      return false;
    }
    this.ctx.resume().catch(() => {});
    // she greets you when you come back — but alt-tab flicker stays quiet;
    // returns whether the greeting voiced (caller may add the caption bubble)
    if (performance.now() - this._hiddenAt > 3000) {
      return this.playClip("greet", 0.9) || !this._blip({ freq: 640, to: 830, dur: 0.11, vol: 0.12 });
    }
    return false;
  }
}
