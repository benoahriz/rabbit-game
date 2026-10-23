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
 * - Stroke STARTING ON THE RABBIT'S HEAD  -> onPetTick() while moving (immediate wiggle), onPetDone("pet") on release
 * - Plain tap on the head                 -> onPetDone("tap") (a gentle head-pet)
 * - Strokes that start on the body        -> ignored (petting is a head ritual; non-punishing no-op)
 * - Tap the carrot basket                 -> onFeed()
 * - Drag a carrot out of the basket, release over rabbit (body rect) -> onFeed()
 *   (a floating ghost carrot follows the pointer; a successful drop snaps it to the
 *   mouth, a miss returns it to the basket)
 * - Any first gesture                     -> onInteract() (audio unlock, mandatory before sound)
 * callbacks: { onPetTick, onPetDone, onFeed, onInteract, getHeadRect, getRabbitRect, getMouthPoint }
 * getHeadRect()/getRabbitRect()/getMouthPoint() -> CSS-pixel geometry (from the renderer).
 */
export class InputController {
  constructor(surface, basketButton, callbacks) {
    this.surface = surface;
    this.basketBtn = basketButton;
    this.cb = callbacks;
    this.samples = [];
    this.strokeAccum = 0;
    this._bound = [];
  }

  _on(target, type, fn, opts) { target.addEventListener(type, fn, opts); this._bound.push([target, type, fn, opts]); }
  detach() { for (const [t, ty, fn, o] of this._bound) t.removeEventListener(ty, fn, o); this._bound = []; this._removeGhost(); }

  attach() {
    this._on(this.surface, "pointerdown", (e) => {
      this.cb.onInteract?.();
      const head = this.cb.getHeadRect?.();
      this.samples = pointInRect(e.clientX, e.clientY, head) ? [{ x: e.clientX, y: e.clientY, t: e.timeStamp }] : [];
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

    // Carrot basket: plain click = feed (a11y). Drag a carrot: a ghost follows the
    // pointer; drop over the rabbit = feed (snap-to-mouth), drop anywhere else =
    // return ghost to the basket. Trailing click after a drag is suppressed.
    this._on(this.basketBtn, "click", () => {
      if (this.dragMoved) { this.dragMoved = false; return; } // trailing click after drag — suppress
      this.cb.onFeed?.();
    });
    this._on(this.basketBtn, "pointerdown", (e) => {
      e.preventDefault();
      try { this.basketBtn.setPointerCapture(e.pointerId); } catch { /* synthetic or retired pointer id */ }
      this.dragMoved = false;
      this._downPt = { x: e.clientX, y: e.clientY };
      this.cb.onInteract?.();
    });
    this._on(this.basketBtn, "pointermove", (e) => {
      if (!this._downPt) return;
      const d = Math.hypot(e.clientX - this._downPt.x, e.clientY - this._downPt.y);
      if (d > 10) {
        this.dragMoved = true;
        this._ensureGhost();
        this._moveGhost(e.clientX, e.clientY, e.pointerType);
      }
    });
    this._on(this.basketBtn, "pointerup", (e) => {
      if (this._downPt && this.dragMoved) {
        const r = this.cb.getRabbitRect?.();
        if (pointInRect(e.clientX, e.clientY, r)) {
          this.cb.onFeed?.();
          this._snapGhostToMouth();
        } else {
          this._returnGhost();
        }
      }
      this._downPt = null;
    });
    this._on(this.basketBtn, "pointercancel", () => {
      if (this.dragMoved) this._returnGhost();
      this._downPt = null;
    });
  }

  // ---- drag-feed ghost (floating carrot that follows the pointer) ----

  _ensureGhost() {
    if (this._ghost || !this.basketBtn) return;
    const g = document.createElement("div");
    g.id = "drag-ghost";
    g.setAttribute("aria-hidden", "true");
    g.innerHTML = GHOST_CARROT_SVG;
    document.body.appendChild(g);
    this._ghost = g;
    this.basketBtn.classList.add("grabbing"); // hide the carrot being carried
  }

  _moveGhost(x, y, pointerType) {
    if (!this._ghost) return;
    // lift the carrot well above the finger so it stays visible on touch
    const oy = pointerType === "touch" ? 46 : 8;
    this._ghost.style.transform = `translate(${x - 23}px, ${y - oy - 19}px)`;
  }

  _snapGhostToMouth() {
    const mouth = this.cb.getMouthPoint?.();
    if (!this._ghost || !mouth) { this._removeGhost(); return; }
    const g = this._ghost;
    this._ghost = null;
    g.classList.add("snapping");
    g.style.transform = `translate(${mouth.x - 12}px, ${mouth.y - 30}px) scale(0.55)`;
    setTimeout(() => g.remove(), 220);
    this._settleBasket();
  }

  _returnGhost() {
    if (this._ghost && this.basketBtn) {
      const br = this.basketBtn.getBoundingClientRect();
      const g = this._ghost;
      this._ghost = null;
      g.classList.add("returning");
      g.style.transform = `translate(${br.left + br.width / 2 - 23}px, ${br.top + br.height / 2 - 44}px) scale(0.5)`;
      setTimeout(() => g.remove(), 240);
    }
    this._settleBasket();
  }

  _removeGhost() {
    if (this._ghost) { this._ghost.remove(); this._ghost = null; }
    this._settleBasket();
  }

  _settleBasket() {
    if (!this.basketBtn) return;
    setTimeout(() => this.basketBtn.classList.remove("grabbing"), 220);
  }
}

/** Standalone carrot glyph for the drag ghost (matches the basket's canon carrot palette). */
const GHOST_CARROT_SVG = `
<svg viewBox="8 0 34 30" aria-hidden="true">
  <path d="M14 28c-1.1 0-1.9-.7-2.1-1.9l-1.4-16.1C10.2 8.4 11.8 7 14 7s3.8 1.4 3.5 3l-1.4 16.1c-.2 1.2-1 1.9-2.1 1.9z" fill="#f2803c"/>
  <path d="M12 14.6l3-1.3M12.6 18.3l2.8-1.3" stroke="#d9662a" stroke-width="1.1" stroke-linecap="round" fill="none"/>
  <g transform="translate(1.8 0.3)">
    <path d="M12.2 6.9c-.5-2 1-3.4 2.8-3.2-.1 1.9-.9 3-2.8 3.2z" fill="#6bbf59"/>
    <path d="M12.4 6.9c1.6-1.3 3.6-.9 4.2 1-1.8.7-3.2.3-4.2-1z" fill="#7fca70"/>
  </g>
</svg>`;
