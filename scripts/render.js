// rabbit-game v0.2-alpha — canvas renderer driven by REAL pipeline art (ADR-0002 promoted assets):
//   assets/scene/background.png   — canon tea-garden master (Q-015 + amendment)
//   assets/character/rabbit-idle.png — canon bunny master (Q-014; opaque; chroma-keyed at load)
// The sprite key is a deliberate simplification (lean-ctx ceiling): runtime border flood-fill on the
// flat matte ground — replace with pre-baked transparent cutouts when the expression sheet lands.
// If assets fail to load, falls back to the labeled v0.1 code-drawn placeholder (dev fallback only).

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw new Error("Canvas 2D unavailable — this toy requires it.");
    this.rabbitRect = { x: 0, y: 0, w: 0, h: 0 };
    this.headRect = { x: 0, y: 0, w: 0, h: 0 };
    this.mouthPoint = { x: 0, y: 0 };
    this.reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    this.sceneImg = null;
    this.roomImg = null;        // pink-room master (second environment)
    this.setting = "garden";    // current environment: "garden" | "room"
    this.rabbitSprite = null;   // ImageBitmap, ground keyed to transparent
    this.artFailed = false;
    this._loadPromise = null;
  }

  /** Load promoted art assets. Call once at boot; draw() degrades to placeholder until it resolves. */
  async load({
    sceneSrc = "assets/scene/background.png",
    roomSrc = "assets/scene/pink-room.png",
    rabbitSrc = "assets/character/rabbit-idle.png",
  } = {}) {
    this._loadPromise = (async () => {
      const [scene, room, opaque] = await Promise.all([
        this._loadImg(sceneSrc),
        this._loadImg(roomSrc).catch(() => null), // room is optional until promoted; garden keeps working
        this._loadImg(rabbitSrc),
      ]);
      this.sceneImg = scene;
      if (room) this.roomImg = room;
      this.rabbitSprite = await this._keyRabbit(opaque);
    })();
    try {
      await this._loadPromise;
    } catch (err) {
      console.warn("[rabbit] art assets unavailable — falling back to placeholder renderer", err);
      this.artFailed = true;
    }
    return !this.artFailed;
  }

  _loadImg(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`failed to load ${src}`));
      img.src = src;
    });
  }

  /** Clear the plain matte ground around the canon bunny: BFS flood from the image borders,
   *  stepping only across pixels close to their neighbor (gradient-safe), so fur/outline are
   *  never eaten. Enclosed regions (inner ears, paw gaps) stay opaque by construction. */
  async _keyRabbit(img) {
    const n = img.naturalWidth, m = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = n; c.height = m;
    const cx = c.getContext("2d", { willReadFrequently: true });
    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, n, m);
    const px = data.data;
    const idx = (x, y) => (y * n + x) * 4;
    const near = (a, b, tol) =>
      Math.abs(px[a] - px[b]) <= tol && Math.abs(px[a + 1] - px[b + 1]) <= tol &&
      Math.abs(px[a + 2] - px[b + 2]) <= tol && Math.abs(px[a + 3] - px[b + 3]) <= tol;

    const mask = new Uint8Array(n * m); // 1 = background
    const stack = [];
    for (let x = 0; x < n; x++) { stack.push(x, 0, x, m - 1); }
    for (let y = 0; y < m; y++) { stack.push(0, y, n - 1, y); }
    const NEIGHBOR_TOL = 9; // matte ground is near-flat; AA ring into the outline is much steeper
    mask[0] = 1; // seed accepted trivially (border pixel is ground by construction)
    const inBounds = (x, y) => x >= 0 && y >= 0 && x < n && y < m;
    while (stack.length) {
      const y0 = stack.pop(), x0 = stack.pop();
      if (!inBounds(x0, y0)) continue;
      const i0 = y0 * n + x0;
      if (!mask[i0]) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = x0 + dx, y = y0 + dy;
        if (!inBounds(x, y)) continue;
        const i = y * n + x;
        if (mask[i]) continue;
        if (near(i0 * 4, i * 4, NEIGHBOR_TOL)) { mask[i] = 1; stack.push(x, y); }
      }
    }

    // soften the cut edge: one feather ring from masked → unmasked
    const feather = new Uint8Array(n * m);
    for (let y = 0; y < m; y++) {
      for (let x = 0; x < n; x++) {
        const i = y * n + x;
        if (mask[i] || feather[i]) continue;
        if ((x > 0 && mask[i - 1]) || (x < n - 1 && mask[i + 1]) ||
            (y > 0 && mask[i - n]) || (y < m - 1 && mask[i + n])) feather[i] = 1;
      }
    }

    for (let i = 0; i < n * m; i++) {
      const p = i * 4;
      if (feather[i]) px[p + 3] = Math.round(px[p + 3] * 0.55);
      else if (mask[i]) px[p + 3] = 0;
    }
    cx.putImageData(data, 0, 0);
    if ("createImageBitmap" in window) return createImageBitmap(c);
    return c;
  }

  resize(w, h) {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = w; this.h = h;
  }

  /** Set the current environment ("garden" | "room"); redrawing happens every frame. */
  setSetting(id) {
    if (id === "garden" || id === "room") this.setting = id;
  }

  /** CSS-pixel rect around the rabbit's whole body (drag-feed drop target). */
  getRabbitRect() { return this.rabbitRect; }

  /** CSS-pixel rect around the rabbit's head + ears (pet target — petting the head only, user direction 2026-10-23). */
  getHeadRect() { return this.headRect; }

  /** CSS-pixel mouth position (drag-feed snap target for the carried carrot ghost). */
  getMouthPoint() { return this.mouthPoint; }

  draw(state) {
    const { ctx, w, h } = this;
    const t = performance.now();
    ctx.clearRect(0, 0, w, h);
    const bg = this.setting === "room" ? this.roomImg : this.sceneImg;
    if (bg && this.rabbitSprite) {
      this._drawScene(bg);
      this._drawRabbit(state, t);
      return;
    }
    this._drawFallbackLegacy(state, t);
  }

  // ---- real art path ----

  _drawScene(img) {
    const { ctx, w, h } = this;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  /** Canon bunny sprite on the quiet left lawn (master A composition: rest space center-left). */
  _drawRabbit(s, t) {
    const { ctx, w, h, reducedMotion } = this;
    const box = this._rabbitBox();
    const baseY = box.y + box.h;

    // sprite-level motion (expression-sheet frames will refine: faces/chomps/ear work)
    let bounce = 0, breathe = 1, tilt = 0;
    if (s.state === "happy") {
      const p = s.progress();
      bounce = reducedMotion ? 0 : -Math.abs(Math.sin(p * Math.PI * 4)) * box.h * 0.10;
      tilt = reducedMotion ? 0 : Math.sin(p * Math.PI * 8) * 0.05;
    } else if (s.state === "eating") {
      const p = s.progress();
      breathe = 1 - (reducedMotion ? 0 : Math.abs(Math.sin(p * Math.PI * 6)) * 0.045);
    } else {
      breathe = 1 + (reducedMotion ? 0 : Math.sin(t / 1000 * 1.6) * 0.015);
    }

    const dw = box.w, dh = (box.h) * breathe;
    ctx.save();
    ctx.translate(box.x + box.w / 2, baseY + bounce);
    ctx.rotate(tilt);
    ctx.drawImage(this.rabbitSprite, -dw / 2, -dh, dw, dh);
    ctx.restore();

    // record hit rects (CSS px): body (feed/drop target) and head (pet target)
    // fractions measured from the canon master (r3-fullbody-flat-matte): head+ears occupy
    // roughly x 0.20–0.80, y 0.02–0.58 of the sprite frame
    this.rabbitRect = { x: box.x, y: box.y, w: box.w, h: box.h };
    this.headRect = {
      x: box.x + 0.20 * box.w,
      y: box.y + 0.02 * box.h,
      w: 0.60 * box.w,
      h: 0.56 * box.h,
    };
    // mouth anchor for drag-feed snap: face center of the canon sprite (eyes ~0.30h,
    // chin ~0.58h → mouth at ~0.44h of the sprite frame, horizontally centered)
    this.mouthPoint = { x: box.x + box.w * 0.50, y: box.y + box.h * 0.44 };
  }

  /** Sprite placement per environment: garden = quiet left lawn on the grass band;
   *  room = centered, feet ON the center rug (lower baseline — the room's floor sits
   *  lower in the composition). Baselines tuned against the promoted masters. */
  _rabbitBox() {
    const { w, h, setting } = this;
    const boxH = Math.min(h * 0.40, w * 0.34);
    const cx = setting === "room" ? w / 2 : w * 0.30;
    const baseY = setting === "room" ? h * 0.90 : h * 0.80;
    return {
      x: cx - boxH * 0.5,
      y: baseY - boxH,
      w: boxH,
      h: boxH,
    };
  }

  // ---- legacy placeholder fallback (dev only; labeled; may never reach a v1 release) ----

  _drawFallbackLegacy(state, t) {
    const { ctx, w, h } = this;
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--bg").trim();
    const floor = styles.getPropertyValue("--floor").trim();
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const horizon = h * 0.58;
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, w, h - horizon);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.80, Math.min(w * 0.34, 260), Math.min(h * 0.075, 48), 0, 0, Math.PI * 2);
    ctx.fill();
    this._rabbit(state, t);
    ctx.fillStyle = "rgba(90, 70, 80, 0.35)";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("placeholder art (fallback) — promoted art assets failed to load", 10, h - 8);
  }

  _capsule(x, y, rx, ry) {
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

  // ---- placeholder rabbit body (kawaii-ish primitive shapes) ----
  _rabbit(s, t) {
    const { ctx, w, h, reducedMotion } = this;
    const cx = w / 2;
    const baseY = h * 0.80;
    const u = Math.max(90, Math.min(w * 0.26, h * 0.24));

    let bend = 0, bounce = 0, chomp = 0, headShake = 0, earRot = 0;
    const breathe = reducedMotion ? 0 : Math.sin(t / 1000 * 1.6) * 0.02;

    if (s.state === "eating") {
      const p = s.progress();
      chomp = Math.abs(Math.sin(p * Math.PI * 6));
      headShake = reducedMotion ? 0 : Math.sin(p * Math.PI * 12) * 0.04;
    } else if (s.state === "happy") {
      const p = s.progress();
      bounce = reducedMotion ? 0 : -Math.abs(Math.sin(p * Math.PI * 4)) * u * 0.12;
      earRot = Math.sin(p * Math.PI * 8) * 0.22;
    } else {
      earRot = reducedMotion ? 0 : s.earTwitch() * 0.16;
    }

    const bodyY = baseY - u * 0.30 + bounce;
    const headY = baseY - u * 0.78 + bounce + breathe * u;
    const bodyR = u * 0.34 * (1 + breathe);
    const headR = u * 0.30;

    ctx.fillStyle = "rgba(120, 80, 100, 0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, baseY + u * 0.06, bodyR * 1.25, bodyR * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    const earLean = [-1, 1];
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

    ctx.fillStyle = "#f7dfe7";
    ctx.beginPath();
    ctx.ellipse(cx, bodyY, bodyR, bodyR * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff2f5";
    ctx.beginPath();
    ctx.ellipse(cx, bodyY + bodyR * 0.25, bodyR * 0.62, bodyR * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    const hx = cx + headShake * u;
    ctx.fillStyle = "#f7dfe7";
    ctx.beginPath();
    ctx.arc(hx, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    const blink = Math.min(1, Math.max(0, s.blink()));
    const eyeY = headY - headR * 0.05;
    const eyeDX = headR * 0.40;
    ctx.fillStyle = "#4a3b41";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + side * eyeDX, eyeY, headR * 0.085, headR * 0.10 * (1 - blink) + 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#e88ca4";
    ctx.beginPath();
    ctx.ellipse(hx, eyeY + headR * 0.16, headR * 0.075, headR * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
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

    ctx.fillStyle = "rgba(240, 130, 160, 0.25)";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + side * headR * 0.62, eyeY + headR * 0.18, headR * 0.12, headR * 0.075, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fff2f5";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * bodyR * 0.55, bodyY + bodyR * 0.95, bodyR * 0.22, bodyR * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

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

    this.rabbitRect = {
      x: cx - bodyR * 1.4,
      y: headY - headR * 2.2,
      w: bodyR * 2.8,
      h: baseY - headY + headR * 2.4,
    };
    this.headRect = {
      x: hx - headR * 1.15,
      y: headY - headR * 2.45,
      w: headR * 2.3,
      h: headR * 3.0,
    };
    this.mouthPoint = { x: hx, y: eyeY + headR * 0.30 };
  }
}
