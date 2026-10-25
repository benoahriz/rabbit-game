// rabbit-game v0.2 — canvas renderer driven by REAL pipeline art (ADR-0002 promoted assets):
//   assets/scene/background.png     — canon tea-garden master (Q-015 + amendment)
//   assets/scene/pink-room.png      — second environment (ESC menu)
//   assets/character/rabbit-idle.png — canon bunny master (Q-014; opaque; chroma-keyed at load)
//   assets/character/rabbit-{blink,ear-twitch,chomp-closed,happy}.png — expression frames
//     (position/palette-frozen swaps per the expression-sheet round critiques)
// The runtime border flood-fill key is a deliberate simplification (lean-ctx ceiling): it now
// runs per frame at boot; upgrade to pre-baked alpha cutouts via an offline mechanical key.
// If assets fail to load, falls back to the labeled v0.1 code-drawn placeholder (dev fallback only).

/**
 * Face anchors as fractions of the canon sprite frame (r3-fullbody-flat-matte),
 * pixel-measured in-browser 2026-10-23: open-eye dark-blob centroid + tongue-pink
 * centroid. Overlays (carrot-at-mouth, crumbs) draw at these fractions; blink is
 * a promoted expression frame now, not an overlay.
 */
const SPRITE_FACE = {
  eye: [0.392, 0.477], // the one OPEN eye (the other is the canon wink)
  mouth: [0.505, 0.525],
};

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
    this.frames = null;         // keyed expression frames: { blink, ear, chompClosed, happy }
    this._spriteUsed = "idle"; // debug/verification: which frame the last draw picked
    this.artFailed = false;
    this._loadPromise = null;
    this._fx = [];            // transient reward particles (crumbs/heart), purge-wrapped
    this._lastState = "idle"; // transition detector for crumb/heart spawns
    this.pointer = null;     // last known pointer position (perk-at-cursor lean, IDEA-005)
  }

  /** Load promoted art assets. Call once at boot; draw() degrades to placeholder until it resolves. */
  async load({
    sceneSrc = "assets/scene/background.png",
    roomSrc = "assets/scene/pink-room.png",
    rabbitSrc = "assets/character/rabbit-idle.png",
    frameSrcs = {
      blink: "assets/character/rabbit-blink.png",
      ear: "assets/character/rabbit-ear-twitch.png",
      chompClosed: "assets/character/rabbit-chomp-closed.png",
      happy: "assets/character/rabbit-happy.png",
    },
  } = {}) {
    // Progressive load (2026-10-25 flash fix): the critical pair for the CURRENT
    // setting renders the moment it lands (~2 MB); the other environment + the
    // expression frames (~4.5 MB) stream in behind — the swap logic is already
    // graceful about late/missing frames. Before this, all 7 images had to arrive
    // before any real art painted, and the v0.1 placeholder flashed in the gap.
    this._loadPromise = (async () => {
      const wantRoomFirst = this.setting === "room";
      const frameKeys = Object.keys(frameSrcs);
      const [scene, opaque] = await Promise.all([
        this._loadImg(wantRoomFirst ? roomSrc : sceneSrc),
        this._loadImg(rabbitSrc),
      ]);
      if (wantRoomFirst) this.roomImg = scene; else this.sceneImg = scene;
      this.rabbitSprite = await this._keyRabbit(opaque);
      // secondary wave: the other environment + expression frames, failures tolerated
      const [other, ...frameImgs] = await Promise.all([
        this._loadImg(wantRoomFirst ? sceneSrc : roomSrc).catch(() => null),
        ...frameKeys.map((k) => this._loadImg(frameSrcs[k]).catch(() => null)),
      ]);
      if (other) { if (wantRoomFirst) this.sceneImg = other; else this.roomImg = other; }
      // expression frames: same border flood-fill key; a failed frame just skips that swap
      const keyed = await Promise.all(frameImgs.map((img) => (img ? this._keyRabbit(img) : null)));
      this.frames = Object.fromEntries(frameKeys.map((k, i) => [k, keyed[i]]));
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
    // art still downloading → draw nothing (the cream page + "casey" wordmark carry
    // the moment). The placeholder paints ONLY on a real load failure — before
    // 2026-10-25 it flashed here for the whole cold-load window.
    if (this.artFailed) this._drawFallbackLegacy(state, t);
  }

  // ---- real art path ----

  _drawScene(img) {
    const { ctx, w, h } = this;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  /**
   * Canon bunny sprite + overlay juice. Expression frames (position/palette-frozen art,
   * manifest-provenance swaps) cover blink / ear-twitch / chomp cycle / happy joy; the
   * canvas overlays that remain are juice, not anatomy: petting wiggle, damped happy hop,
   * carrot-at-mouth + crumb/heart particles. Face anchors are fractions of the sprite
   * frame, pixel-measured from the canon master (r3-fullbody-flat-matte, 2026-10-23).
   */
  _drawRabbit(s, t) {
    const { ctx, w, h, reducedMotion } = this;
    const box = this._rabbitBox();
    const baseY = box.y + box.h;
    const dt = Math.min(0.05, (t - (this._lastT || t)) / 1000);
    this._lastT = t;

    // sprite-level motion
    let bounce = 0, breathe = 1, tilt = 0;
    if (s.state === "happy") {
      const p = s.progress();
      // damped hop: one big jump, a small recoil, then rest (Feel rule #2/#3)
      bounce = reducedMotion ? 0 : -box.h * 0.12 * Math.exp(-2.2 * p) * Math.abs(Math.sin(p * Math.PI * 2.2));
      tilt = reducedMotion ? 0 : Math.sin(p * Math.PI * 6) * 0.05;
    } else if (s.state === "eating") {
      const p = s.progress();
      breathe = 1 - (reducedMotion ? 0 : Math.abs(Math.sin(p * Math.PI * 6)) * 0.045);
    } else if (s.petHeat > 0.06 && !reducedMotion) {
      // wiggle under the hand while being petted (heat resets on entering happy, so no overlap)
      tilt = Math.sin(t / 1000 * 9) * 0.045 * Math.min(1, s.petHeat * 2);
    } else {
      breathe = 1 + (reducedMotion ? 0 : Math.sin(t / 1000 * 1.6) * 0.015);
      // she notices you (IDEA-005): a gentle lean toward the pointer when it lingers nearby
      const p = this.pointer;
      if (p && !reducedMotion) {
        const dx = p.x - (box.x + box.w / 2);
        if (Math.abs(dx) < box.w * 1.6) {
          tilt = Math.max(-1, Math.min(1, dx / box.w)) * 0.055;
        }
      }
    }

    // expression frame swap — priority: happy joy > eating chomp cycle (the idle master's
    // open smile is the cycle's OPEN phase) > blink (skipped while eating so the mouth owns
    // the face) > ear twitch > idle master. Missing frames fall through to idle.
    const nib = s.state === "eating" && !reducedMotion ? Math.sin(s.progress() * Math.PI * 8) : 0;
    let sprite = this.rabbitSprite, used = "idle";
    const F = this.frames;
    if (F) {
      if (s.state === "happy" && F.happy) { sprite = F.happy; used = "happy"; }
      else if (s.state === "eating" && nib > 0 && F.chompClosed) { sprite = F.chompClosed; used = "chompClosed"; }
      else if (s.blink() > 0.6 && s.state !== "eating" && F.blink) { sprite = F.blink; used = "blink"; }
      else if (s.state !== "eating" && Math.abs(s.earTwitch()) > 0.3 && F.ear) { sprite = F.ear; used = "ear"; }
    }
    this._spriteUsed = used; // browser-assert hook (paired with globalThis.__rabbit_game)

    const dw = box.w, dh = (box.h) * breathe;
    ctx.save();
    ctx.translate(box.x + box.w / 2, baseY + bounce);
    ctx.rotate(tilt);
    ctx.drawImage(sprite, -dw / 2, -dh, dw, dh);
    ctx.restore();

    // face anchor in screen space (fraction from the canon master)
    const mx = box.x + SPRITE_FACE.mouth[0] * box.w, my = box.y + SPRITE_FACE.mouth[1] * box.h;

    // eating: carrot held at the mouth with a nibble bob + crumb burst on the first bite
    if (s.state === "eating") {
      this._carrotAtMouth(mx, my, box, nib);
      if (this._lastState !== "eating") this._spawnCrumbs(mx, my, box);
    }
    // happy entry: one heart poof (reward clarifies state — Feel rule #5)
    if (s.state === "happy" && this._lastState !== "happy" && !reducedMotion) {
      this._fx.push({ kind: "heart", x: box.x + box.w * 0.68, y: box.y + box.h * 0.22,
                      vx: 0, vy: -box.h * 0.07, born: t, life: 900 });
    }
    this._updateFx(t, dt, box.w);

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
    this.mouthPoint = { x: mx, y: my };
    this._lastState = s.state;
  }

  /** Canon-palette carrot held at the mouth's right corner while eating
   *  (pivot outside the muzzle silhouette; nib = chomp phase). */
  _carrotAtMouth(mx, my, box, nib) {
    const ctx = this.ctx;
    const l = box.h * 0.11, r = l * 0.26;
    ctx.save();
    ctx.translate(box.x + box.w * 0.65, my + box.h * 0.005 + nib * box.h * 0.005);
    ctx.rotate(0.72);
    ctx.fillStyle = "#f2803c";
    this._capsule(0, -l, r, l);
    ctx.strokeStyle = "#d9662a";
    ctx.lineWidth = Math.max(1, r * 0.22);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, -l * 0.72); ctx.lineTo(r * 0.4, -l * 0.62);
    ctx.moveTo(-r * 0.3, -l * 0.42); ctx.lineTo(r * 0.4, -l * 0.32);
    ctx.stroke();
    ctx.fillStyle = "#6bbf59";
    ctx.beginPath();
    ctx.ellipse(-r * 0.55, -l * 1.12, r * 0.55, r * 0.3, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7fca70";
    ctx.beginPath();
    ctx.ellipse(r * 0.45, -l * 1.08, r * 0.5, r * 0.28, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** 6 carrot crumbs pop out of the mouth on the first bite (visible size). */
  _spawnCrumbs(mx, my, box) {
    for (let i = 0; i < 6; i++) {
      this._fx.push({
        kind: "crumb",
        x: mx + (Math.random() - 0.5) * box.w * 0.08,
        y: my + box.h * 0.02,
        vx: (Math.random() - 0.35) * box.w * 0.14,
        vy: -box.h * (0.10 + Math.random() * 0.10),
        born: performance.now(),
        life: 650 + Math.random() * 250,
        c: i % 2 ? "#f2803c" : "#d9662a",
      });
    }
  }

  /** Tiny particle pool (crumbs + heart); crumbs get gravity, the heart floats and fades. */
  _updateFx(t, dt, boxW) {
    const { ctx } = this;
    for (let i = this._fx.length - 1; i >= 0; i--) {
      const f = this._fx[i];
      const age = t - f.born;
      if (age > f.life) { this._fx.splice(i, 1); continue; }
      const p = age / f.life;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.kind === "crumb") f.vy += boxW * 0.9 * dt; // gravity, scaled to the canvas
      ctx.save();
      ctx.globalAlpha = 1 - p * p;
      if (f.kind === "crumb") {
        ctx.fillStyle = f.c;
        const r = Math.max(2.5, boxW * 0.013);
        ctx.beginPath();
        ctx.ellipse(f.x, f.y, r, r * 0.75, p * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        this._heartPath(f.x, f.y, boxW * 0.03);
        ctx.fillStyle = "#f08fae";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(1.5, boxW * 0.005);
        ctx.lineJoin = "round";
        ctx.stroke(); // white halo first, so the heart reads on pink rooms + the bow
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /** Small kawaii heart path (bow-pink family), centered at (x, y) — caller strokes/fills. */
  _heartPath(x, y, s) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.95);
    ctx.bezierCurveTo(x - s * 1.5, y - s * 0.2, x - s * 0.55, y - s * 1.05, x, y - s * 0.3);
    ctx.bezierCurveTo(x + s * 0.55, y - s * 1.05, x + s * 1.5, y - s * 0.2, x, y + s * 0.95);
    ctx.closePath();
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
