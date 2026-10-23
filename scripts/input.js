// rabbit-game v0.1 — input: pointer events (pet strokes, carrot drag-feed) + keyboard fallback.
// classifyStroke/pointInRect are pure (tested by node --test). The controller is DOM-bound.

/** Classify a pointer stroke. samples: [{x,y,t}]. Returns "pet" | "tap" | null. */
export function classifyStroke(samples, { MIN_STROKE = 28 } = {}) {
  if (!samples || samples.length === 0) return null;
  if (samples.length === 1) return "tap";
  let dist = 0;
  for (let i = 1; i < samples.length; i++) {
    dist += Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y);
  }
  return dist >= MIN_STROKE ? "pet" : "tap";
}

/** Is a client-space point inside a rect {x,y,w,h}? */
export function pointInRect(x, y, r) {
  return !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/**
 * Gestures:
 * - Stroke ON the rabbit                  -> onPetTick() while moving (immediate wiggle), onPetDone("pet") on release
 * - Plain tap on the rabbit               -> onPetDone("tap") (a gentle pet)
 * - Tap the carrot button                 -> onFeed()
 * - Pointer down on carrot, release over rabbit -> onFeed()
 * - Any first gesture                     -> onInteract() (audio unlock, mandatory before sound)
 * callbacks: { onPetTick, onPetDone, onFeed, onInteract, getRabbitRect }
 * getRabbitRect() -> {x,y,w,h} in CSS pixels (from the renderer).
 */
export class InputController {
  constructor(surface, carrotButton, callbacks) {
    this.surface = surface;
    this.carrotBtn = carrotButton;
    this.cb = callbacks;
    this.samples = [];
    this.strokeAccum = 0;
    this._bound = [];
  }

  _on(target, type, fn, opts) { target.addEventListener(type, fn, opts); this._bound.push([target, type, fn, opts]); }
  detach() { for (const [t, ty, fn, o] of this._bound) t.removeEventListener(ty, fn, o); this._bound = []; }

  attach() {
    this._on(this.surface, "pointerdown", (e) => {
      this.cb.onInteract?.();
      const r = this.cb.getRabbitRect?.();
      this.samples = pointInRect(e.clientX, e.clientY, r) ? [{ x: e.clientX, y: e.clientY, t: e.timeStamp }] : [];
      this.strokeAccum = 0;
    });

    this._on(this.surface, "pointermove", (e) => {
      if (this.samples.length === 0) return;
      const last = this.samples[this.samples.length - 1];
      const d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      this.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
      if (d > 0) {
        this.strokeAccum += d;
        if (this.strokeAccum >= 48) { this.strokeAccum = 0; this.cb.onPetTick?.(); }
      }
    });

    this._on(this.surface, "pointerup", (e) => {
      const kind = classifyStroke(this.samples);
      this.samples = [];
      if (kind) this.cb.onPetDone?.(kind);
    });

    this._on(this.surface, "pointercancel", () => { this.samples = []; this.strokeAccum = 0; });

    // Keyboard fallback (PRD §6.1): F feeds, P pets. No hold-repeat spam.
    this._on(window, "keydown", (e) => {
      if (e.repeat) return;
      this.cb.onInteract?.();
      if (e.key === "f" || e.key === "F") this.cb.onFeed();
      else if (e.key === "p" || e.key === "P") this.cb.onPetDone("pet");
    });

    // Carrot: plain click = feed. A drag-release suppresses its own trailing click.
    this._on(this.carrotBtn, "click", () => {
      if (this.dragMoved) { this.dragMoved = false; return; } // trailing click after drag — suppress
      this.cb.onFeed?.();
    });
    this._on(this.carrotBtn, "pointerdown", (e) => {
      e.preventDefault();
      this.carrotBtn.setPointerCapture(e.pointerId);
      this.dragMoved = false;
      this._downPt = { x: e.clientX, y: e.clientY };
      this.cb.onInteract?.();
    });
    this._on(this.carrotBtn, "pointermove", (e) => {
      if (this._downPt) {
        const d = Math.hypot(e.clientX - this._downPt.x, e.clientY - this._downPt.y);
        if (d > 10) this.dragMoved = true;
      }
    });
    this._on(this.carrotBtn, "pointerup", (e) => {
      if (this.dragMoved) {
        const r = this.cb.getRabbitRect?.();
        if (pointInRect(e.clientX, e.clientY, r)) this.cb.onFeed?.();
      }
      this._downPt = null;
    });
  }
}
