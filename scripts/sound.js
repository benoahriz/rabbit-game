// rabbit-game v0.1 — synthesized cute noises (WebAudio). No audio files in v1 (Q-004).
// Fails closed and quiet: a missing/blocked AudioContext never breaks gameplay.
// lean-ctx ceiling: oscillator blips; upgrade to recorded SFX only via the art pipeline (Q-004 option B).

export class SoundEngine {
  constructor({ getMuted = () => false } = {}) {
    this.ctx = null;          // created lazily on first user gesture (autoplay policy)
    this.master = null;
    this.getMuted = getMuted;
    this.lastChirrup = 0;
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
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
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

  /** Happier eating: three crunches + tiny swallow blip. */
  munch() {
    if (!this.ctx || this.getMuted()) return;
    this._crunch(0);
    this._crunch(0.11);
    this._crunch(0.22);
    this._blip({ freq: 520, to: 430, dur: 0.09, vol: 0.07, when: 0.38 });
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
}
