// rabbit-game v0.1 — synthesized cute noises (WebAudio). No audio files in v1 (Q-004).
// Fails closed and quiet: a missing/blocked AudioContext never breaks gameplay.
// lean-ctx ceiling: oscillator blips; upgrade to recorded SFX only via the art pipeline (Q-004 option B).

const AMBIENCE_VOL = 0.09; // cozy trickle bed; master gain sits on top

export class SoundEngine {
  constructor({ getMuted = () => false } = {}) {
    this.ctx = null;          // created lazily on first user gesture (autoplay policy)
    this.master = null;
    this.getMuted = getMuted;
    this.lastChirrup = 0;
    this._purring = false;   // continuous purr state (IDEA-013)
    this._purrNodes = null;
    this._amb = null;         // ambient water bed (tea-garden water feature)
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

  // ---- ambient cozy trickling water (tea-garden water feature; synthesis, no assets) ----

  /** Continuous soft trickling-water bed + random droplets. Call after unlock(). Idempotent. */
  startAmbience() {
    if (!this.ctx || (this._amb && this._amb.ready)) return;
    const ctx = this.ctx;
    const amb = { ready: false, dropletTimer: null };

    // brown-noise bed = the water's body
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      d[i] = lastOut * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 620; // muffled, cozy — reads as water far across the garden
    const bed = ctx.createGain();
    bed.gain.value = 0.5;
    const ambGain = ctx.createGain();
    ambGain.gain.value = 0.0001;
    src.connect(lp); lp.connect(bed); bed.connect(ambGain); ambGain.connect(this.master);
    src.start();

    // gentle fade-in so the garden "arrives" instead of blaring on unlock
    ambGain.gain.linearRampToValueAtTime(this.getMuted() ? 0.0001 : AMBIENCE_VOL, ctx.currentTime + 3);
    amb.ambGain = ambGain;
    amb.ready = true;
    this._amb = amb;
    this._scheduleDroplet();
  }

  /** Random droplet accents; skipped (cheaply) while muted or page-hidden. */
  _scheduleDroplet() {
    const wait = 160 + Math.random() * 560;
    this._amb.dropletTimer = setTimeout(() => {
      if (this.ctx && !this.getMuted() && !document.hidden) this._droplet();
      this._scheduleDroplet();
    }, wait);
  }

  /** One little water tick — a bandpassed decaying noise splish. */
  _droplet() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const dur = 0.03 + Math.random() * 0.03;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1300 + Math.random() * 1400;
    bp.Q.value = 6;
    const g = ctx.createGain();
    const v = 0.04 + Math.random() * 0.05;
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.02);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t0);
  }

  /** Ramp the ambience with mute; effect sounds are gated independently upstream. */
  setAmbienceMuted(muted) {
    if (!this._amb?.ready || !this.ctx || !this._amb.ambGain) return;
    const g = this._amb.ambGain.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(muted ? 0.0001 : AMBIENCE_VOL, t + 0.8);
  }

  /** Battery courtesy: no audio while the tab is backgrounded. */
  setHidden(hidden) {
    if (!this.ctx) return;
    if (hidden) this.ctx.suspend().catch(() => {});
    else this.ctx.resume().catch(() => {});
  }
}
