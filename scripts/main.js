// rabbit-game v0.1 — boot & wiring. Vanilla ES modules only (AGENTS.md rule 1).
import { RabbitState, isMilestone } from "./rabbit-state.js";
import { InputController, pointInRect } from "./input.js";
import { SoundEngine } from "./sound.js";
import { Store } from "./store.js";
import { SettingsMenu } from "./menu.js";
import { Renderer } from "./render.js";
import { renderMonth } from "./calendar.js";

const canvas = document.getElementById("scene");
const basketBtn = document.getElementById("basket"); // drag one of its carrots to the rabbit's mouth
const muteBtn = document.getElementById("mute");
const fedEl = document.getElementById("fed");

const store = new Store(globalThis.localStorage);
const sound = new SoundEngine({ getMuted: () => store.data.muted });
const state = new RabbitState({ fed: store.data.fed });
const renderer = new Renderer(canvas);

// --- HUD state ---
let lastFedText = null;
const syncFed = () => {
  const txt = `${state.fed} fed`;
  if (txt !== lastFedText) { // pop on change only (boot is quiet)
    lastFedText = txt;
    fedEl.textContent = txt;
    fedEl.classList.remove("pop");
    void fedEl.offsetWidth; // restart the animation on back-to-back feeds
    fedEl.classList.add("pop");
  } else {
    fedEl.textContent = txt;
  }
};
const syncMute = () => {
  muteBtn.setAttribute("aria-pressed", String(store.data.muted));
  muteBtn.classList.toggle("is-muted", store.data.muted);
};

// --- interaction plumbing ---
const onInteract = () => {
  sound.unlock();
  sound.startAmbience(); // tea-garden trickle bed begins after the audio-unlock gesture
};

// --- speech bubbles (IDEA-002, 2026-10-24): Casey's noises made visible; the mute channel ---
const bubblesEl = document.getElementById("bubbles");
let lastBubbleAt = 0;
const BUBBLES = {
  feed: ["nib nib", "nib nib nib", "crunch…"],
  soft: ["pprr", "prr", "mm…"],
  best: ["prr!", "prrr!!"],          // sweet-spot strokes (IDEA-001 grade)
  chirrup: ["prrreet!", "weet!!", "prrr-eet!"],
  perk: ["!", "hm?"],                // she noticed you (IDEA-005)
  boop: ["boop!", "!!", "♡"],       // nose boop (IDEA-012)
  milestone: ["yay!!", "✦ ✦ ✦"],     // fed milestone (IDEA-014)
};
const bubble = (kind, force = false) => {
  const texts = BUBBLES[kind];
  if (!texts || !bubblesEl) return;
  const now = performance.now();
  if (!force && now - lastBubbleAt < 380) return; // visual calm: at most ~2.5 bubbles/second
  lastBubbleAt = now;
  const head = renderer.getHeadRect();
  if (!head.w) return; // first draw hasn't landed yet (no anchors) — skip rather than spawn at the corner
  const b = document.createElement("span");
  b.className = "bubble";
  b.textContent = texts[(Math.random() * texts.length) | 0];
  b.style.left = `${head.x + head.w * 0.55 + (Math.random() * 28 - 14)}px`;
  b.style.top = `${head.y - 4}px`;
  bubblesEl.appendChild(b);
  setTimeout(() => b.remove(), 1500);
};

const playFeed = ({ hiccup }) => {
  if (hiccup) sound.soft();
  sound.munch();
  bubble("feed");
  store.save({ fed: state.fed });
  syncFed();
  if (isMilestone(state.fed)) { // one-shot celebration, never streak pressure (IDEA-014)
    sound.chirrup(performance.now());
    bubble("milestone", true);
    renderer.spawnConfetti();
  }
};

// SoundEngine gates chirrup spam internally (lastChirrup cooldown); handler just plays.
// quality: stroke grade from the input controller (IDEA-001) — better scratches melt her faster.
const playPetTick = (quality = 0.5) => {
  const ev = state.pet(quality);
  if (ev.noise === "chirrup") { sound.chirrup(performance.now()); bubble("chirrup"); }
  else { sound.soft(); bubble(quality > 0.85 ? "best" : "soft"); }
};

const onFeed = () => { playFeed(state.feed()); };
const onPetDone = () => playPetTick();

// boop the nose (IDEA-012): instant surprise — ear twitch, chirrup, heart, a word
const onBoop = () => {
  state.perk();
  sound.chirrup(performance.now());
  bubble("boop", true);
  renderer.spawnHeart();
};

new InputController(canvas, basketBtn, {
  onPetTick: playPetTick,
  onPetDone,
  onFeed,
  onBoop,
  onInteract,
  getRabbitRect: () => renderer.getRabbitRect(), // drag-feed drop target (whole body)
  getHeadRect: () => renderer.getHeadRect(),     // pet target (head + ears only)
  getMouthPoint: () => renderer.getMouthPoint(), // ghost-carrot snap target on a successful drop
  getNosePoint: () => renderer.getNosePoint(),   // boop target (muzzle tip)
}).attach();

// --- she notices you (IDEA-005, perk-at-cursor): lean + ear twitch when the pointer arrives ---
let pointerNear = false;
canvas.addEventListener("pointermove", (e) => {
  renderer.pointer = { x: e.clientX, y: e.clientY };
  const head = renderer.getHeadRect();
  const near = pointInRect(e.clientX, e.clientY,
    { x: head.x - 70, y: head.y - 70, w: head.w + 140, h: head.h + 140 });
  if (near && !pointerNear) {
    pointerNear = true;
    if (state.perk()) { sound.soft(); bubble("perk"); } // one soft notice per approach
  } else if (!near) {
    pointerNear = false;
  }
});
canvas.addEventListener("pointerleave", () => { renderer.pointer = null; pointerNear = false; });

muteBtn.addEventListener("click", () => {
  onInteract(); // allow unmuting-by-click to also be the audio unlock gesture
  store.save({ muted: !store.data.muted });
  sound.setAmbienceMuted(store.data.muted);
  sound.lastChirrup = 0;
  syncMute();
});

// battery politeness: no audio while the tab is backgrounded
document.addEventListener("visibilitychange", () => sound.setHidden(document.hidden));

// --- settings menu (ESC) + environment picker (user direction 2026-10-23) ---
const menu = new SettingsMenu(document.getElementById("menu"), {
  getSetting: () => store.data.setting,
  onSettingChange: (id) => {
    store.save({ setting: id });
    renderer.setSetting(id);
    sound.unlock(); // the click is a valid audio gesture — menu acks were silently no-opping before unlock
    sound.soft(); // tiny acknowledgment blip
  },
});
menu.init();
renderer.setSetting(store.data.setting); // restore persisted environment
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (menu.isOpen) { menu.close(); return; }   // the modal menu is on top — it owns ESC first
  if (!calendarEl.hidden) {                    // then the calendar dialog (a11y: ESC dismisses)
    calendarEl.hidden = true;
    clockChip.setAttribute("aria-expanded", "false");
    return;
  }
  menu.open();
});

// corner menu button (mobile pass 2026-10-24): phones have no ESC key
const menuBtn = document.getElementById("menu-btn");
menuBtn.addEventListener("click", () => menu.toggle());
menu.root.addEventListener("menutoggle", () => {
  menuBtn.setAttribute("aria-expanded", String(menu.isOpen));
  // opening the modal settings card also dismisses the calendar underneath it
  if (menu.isOpen && !calendarEl.hidden) {
    calendarEl.hidden = true;
    clockChip.setAttribute("aria-expanded", "false");
  }
});

// --- clock & calendar (UC-7, 2026-10-24): desk accessories, off by default ---
const clockChip = document.getElementById("clock-chip");
const clockTime = document.getElementById("clock-time");
const clockDate = document.getElementById("clock-date");
const calendarEl = document.getElementById("calendar");
const calGrid = document.getElementById("cal-grid");
const calLabel = document.getElementById("cal-label");
const optClock = document.getElementById("opt-clock");
let calRef = new Date();
let calDayShown = -1;

const syncClock = () => {
  optClock.setAttribute("aria-pressed", String(store.data.clock));
  clockChip.hidden = !store.data.clock;
  if (!store.data.clock) { calendarEl.hidden = true; clockChip.setAttribute("aria-expanded", "false"); }
};
const drawCalendar = (delta = 0) => {
  calRef = new Date(calRef.getFullYear(), calRef.getMonth() + delta, 1);
  calLabel.textContent = renderMonth(calGrid, calRef.getFullYear(), calRef.getMonth());
};
const drawClock = () => {
  if (!store.data.clock) return;
  const now = new Date();
  clockTime.textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  clockDate.textContent = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  if (!calendarEl.hidden && now.getDate() !== calDayShown) { // a desk calendar follows the real date
    calDayShown = now.getDate();
    calRef = new Date();
    drawCalendar();
  }
};
clockChip.addEventListener("click", () => {
  calendarEl.hidden = !calendarEl.hidden;
  clockChip.setAttribute("aria-expanded", String(!calendarEl.hidden));
  if (!calendarEl.hidden) {
    calRef = new Date();
    calDayShown = new Date().getDate(); // anchor the day-rollover detector at open
    drawCalendar();
  }
});
document.getElementById("cal-prev").addEventListener("click", () => drawCalendar(-1));
document.getElementById("cal-next").addEventListener("click", () => drawCalendar(1));
optClock.addEventListener("click", () => {
  store.save({ clock: !store.data.clock });
  syncClock();
  drawClock(); // immediate — never show the placeholder for a second
  sound.unlock(); // same fix as the setting picker: the click unlocks the ack sound
  sound.soft(); // tiny acknowledgment, same as the Setting picker
});
setInterval(drawClock, 1000);

// --- sizing + main loop ---
const fit = () => renderer.resize(canvas.clientWidth, canvas.clientHeight);
if ("ResizeObserver" in window) new ResizeObserver(fit).observe(document.documentElement);
else window.addEventListener("resize", fit);
fit();
syncFed();
syncMute();
syncClock();
drawClock();

// real-art load (v0.2): promoted pipeline assets; draw() shows the labeled placeholder until ready
renderer.load();

let last = performance.now();
const frame = () => {
  const t = performance.now();
  const dt = Math.min(0.05, (t - last) / 1000); // clamp: background tab jumps are not physics
  last = t;
  state.update(dt);
  sound.setPurr(!document.hidden && state.petHeat > 0.3); // purr while she melts under your hand (IDEA-013)
  if (!document.hidden) renderer.draw(state);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

// debug/verification hook for browser smoke checks (harmless; no network, no DOM mutation)
globalThis.__rabbit_game = { state, sound, store, renderer };
