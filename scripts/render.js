// rabbit-game v0.1 — PROVISIONAL canvas renderer: scene layout + code-drawn placeholder rabbit.
// PLACEHOLDER ART RULES (AGENTS.md / assets/placeholder/README.md): this vector rabbit is code-drawn,
// clearly labeled on-screen, and may never reach a v1 release. Final art arrives via the tracked
// pipeline (docs/design/rabbit-game/art/, ADR-0002) in v0.2.
// lean-ctx ceiling: canvas-primitive placeholder; replace drawing body with spritesheet blit on promotion.

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("Canvas 2D unavailable — this toy requires it.");
    this.rabbitRect = { x: 0, y: 0, w: 0, h: 0 };
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }

  resize(w, h) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
  }

  /** CSS-pixel rect around the rabbit (for input hit-testing). */
  getRabbitRect() { return this.rabbitRect; }

  draw(state) {
    const { ctx, w, h } = this;
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--bg").trim();
    const floor = styles.getPropertyValue("--floor").trim();

    ctx.clearRect(0, 0, w, h);
    // wall
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // floor band (stage-set: lower ~42%)
    const horizon = h * 0.58;
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, w, h - horizon);
    // rug
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.80, Math.min(w * 0.34, 260), Math.min(h * 0.075, 48), 0, 0, Math.PI * 2);
    ctx.fill();

    this._rabbit(state, performance.now());
    this._placeholderLabel();
  }

  // ---- placeholder rabbit (kawaii-ish primitive shapes; labeled) ----
  _rabbit(s, t) {
    const { ctx, w, h, reducedMotion } = this;
    const cx = w / 2;
    const baseY = h * 0.80;                      // sits on the rug
    const u = Math.max(90, Math.min(w * 0.26, h * 0.24)); // rabbit unit size

    // global animation offsets
    let bend = 0, bounce = 0, chomp = 0, headShake = 0, earRot = 0;
    const breathe = reducedMotion ? 0 : Math.sin(t / 1000 * 1.6) * 0.02;

    if (s.state === "eating") {
      const p = s.progress();
      chomp = Math.abs(Math.sin(p * Math.PI * 6));       // three chomps
      headShake = reducedMotion ? 0 : Math.sin(p * Math.PI * 12) * 0.04;
    } else if (s.state === "happy") {
      const p = s.progress();
      bounce = reducedMotion ? 0 : -Math.abs(Math.sin(p * Math.PI * 4)) * u * 0.12;
      earRot = Math.sin(p * Math.PI * 8) * 0.22;
    } else {
      earRot = reducedMotion ? 0 : s.earTwitch() * 0.16; // idle twitch
    }

    const bodyY = baseY - u * 0.30 + bounce;
    const headY = baseY - u * 0.78 + bounce + breathe * u;
    const bodyR = u * 0.34 * (1 + breathe);
    const headR = u * 0.30;

    // shadow on rug
    ctx.fillStyle = "rgba(120, 80, 100, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, baseY + u * 0.06, bodyR * 1.25, bodyR * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // ears (with twitch rotation) — behind head
    const earLean = [ -1, 1 ];
    for (const side of earLean) {
      ctx.save();
      ctx.translate(cx + side * headR * 0.42 + headShake * u, headY - headR * 0.75);
      ctx.rotate(side * (0.18 + earRot));
      ctx.fillStyle = "#f3cdd8";
      this._capsule(0, -headR * 0.85, headR * 0.36, headR * 1.55);
      ctx.fillStyle = "#fbd9e3";
      this._capsule(0, -headR * 0.85, headR * 0.20, headR * 1.15);
      ctx.restore();
    }

    // body
    ctx.fillStyle = "#f7dfe7";
    ctx.beginPath();
    ctx.ellipse(cx, bodyY, bodyR, bodyR * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    // belly patch
    ctx.fillStyle = "#fff2f5";
    ctx.beginPath();
    ctx.ellipse(cx, bodyY + bodyR * 0.25, bodyR * 0.62, bodyR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    const hx = cx + headShake * u;
    ctx.fillStyle = "#f7dfe7";
    ctx.beginPath();
    ctx.arc(hx, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // face
    const blink = Math.min(1, Math.max(0, s.blink()));
    const eyeY = headY - headR * 0.05;
    const eyeDX = headR * 0.40;
    ctx.fillStyle = "#4a3b41";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + side * eyeDX, eyeY, headR * 0.085, headR * 0.10 * (1 - blink) + 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // nose (little rounded triangle: ω cursor)
    ctx.fillStyle = "#e88ca4";
    ctx.beginPath();
    ctx.ellipse(hx, eyeY + headR * 0.16, headR * 0.075, headR * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    // mouth: tiny ω curve; opens when chomping
    ctx.strokeStyle = "#4a3b41";
    ctx.lineWidth = Math.max(1.2, headR * 0.05);
    ctx.lineCap = "round";
    ctx.beginPath();
    if (chomp > 0.55) {
      ctx.ellipse(hx, eyeY + headR * 0.30, headR * 0.13, headR * 0.11 * (0.6 + chomp), 0, 0, Math.PI);
    } else {
      ctx.moveTo(hx - headR * 0.16, eyeY + headR * 0.28);
      ctx.quadraticCurveTo(hx - headR * 0.06, eyeY + headR * 0.38, hx, eyeY + headR * 0.30);
      ctx.quadraticCurveTo(hx + headR * 0.06, eyeY + headR * 0.38, hx + headR * 0.16, eyeY + headR * 0.28);
    }
    ctx.stroke();

    // blush
    ctx.fillStyle = "rgba(240, 130, 160, 0.25)";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + side * headR * 0.62, eyeY + headR * 0.18, headR * 0.12, headR * 0.075, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // front paws
    ctx.fillStyle = "#fff2f5";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * bodyR * 0.55, bodyY + bodyR * 0.95, bodyR * 0.22, bodyR * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // eaten carrot bit (held at the mouth while eating)
    if (s.state === "eating") {
      ctx.save();
      ctx.translate(hx + headR * 0.78, headY + headR * 0.42);
      ctx.rotate(0.7);
      ctx.fillStyle = "#f2803c";
      this._capsule(0, 0, headR * 0.16, headR * 0.42);
      ctx.fillStyle = "#6bbf59";
      this._capsule(-headR * 0.04, -headR * 0.34, headR * 0.09, headR * 0.22);
      ctx.restore();
    }

    // record hit rect (CSS px)
    this.rabbitRect = {
      x: cx - bodyR * 1.4,
      y: headY - headR * 2.2,
      w: bodyR * 2.8,
      h: baseY - headY + headR * 2.4,
    };
  }

  _capsule(x, y, rx, ry) {
    // vertical soft capsule centered-ish at x with top y
    const { ctx } = this;
    const r = rx;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x - r, y + ry);
    ctx.arc(x, y + ry, r, Math.PI, 0, true);
    ctx.lineTo(x + r, y);
    ctx.arc(x, y, r, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
  }

  _placeholderLabel() {
    const { ctx, h } = this;
    ctx.fillStyle = "rgba(90, 70, 80, 0.35)";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "left"; // bottom-LEFT: the dock (fed counter) owns bottom-right
    ctx.fillText("placeholder art (v0.1) — final art via tracked pipeline in v0.2", 10, h - 8);
  }
}
