// rabbit-game v0 — provisional scene renderer (empty-scene milestone only).
// lean-ctx ceiling: layout-only scene; upgrade when pipeline promotion lands (v0.2).
// The rabbit is NOT drawn here yet — sprite FSM + spritesheet manifest are v0.1/v0.2 work.
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("Canvas 2D unavailable — this toy requires it.");
  }

  resize(w, h) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
  }

  draw(t) {
    // Scene = wall + floor band + soft rug. Tones come from CSS vars (provisional).
    const { ctx, w, h } = this;
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--bg").trim();
    const floor = styles.getPropertyValue("--floor").trim();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Floor occupies the lower ~42%, like a stage set (art bible §6).
    const horizon = h * 0.58;
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Soft provisional rug marker — the rabbit will rest on it (v0.1+).
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.78, Math.min(w * 0.32, 240), Math.min(h * 0.07, 44), 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
