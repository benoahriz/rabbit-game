// rabbit-game v0.1 — boot & wiring. Vanilla ES modules only (AGENTS.md rule 1).
import { RabbitState } from "./rabbit-state.js";
import { InputController } from "./input.js";
import { SoundEngine } from "./sound.js";
import { Store } from "./store.js";
import { Renderer } from "./render.js";

const canvas = document.getElementById("scene");
const carrotBtn = document.getElementById("carrot");
const muteBtn = document.getElementById("mute");
const fedEl = document.getElementById("fed");

const store = new Store(globalThis.localStorage);
const sound = new SoundEngine({ getMuted: () => store.data.muted });
const state = new RabbitState({ fed: store.data.fed });
const renderer = new Renderer(canvas);

// --- HUD state ---
const syncFed = () => { fedEl.textContent = `${state.fed} fed`; };
const syncMute = () => {
  muteBtn.setAttribute("aria-pressed", String(store.data.muted));
  muteBtn.classList.toggle("is-muted", store.data.muted);
};

// --- interaction plumbing ---
const onInteract = () => {
  sound.unlock();
  sound.startAmbience(); // tea-garden trickle bed begins after the audio-unlock gesture
};

const playFeed = ({ hiccup }) => {
  if (hiccup) sound.soft();
  sound.munch();
  store.save({ fed: state.fed });
  syncFed();
};

// SoundEngine gates chirrup spam internally (lastChirrup cooldown); handler just plays.
const playPetTick = () => {
  const ev = state.pet();
  if (ev.noise === "chirrup") sound.chirrup(performance.now());
  else sound.soft();
};

const onFeed = () => { playFeed(state.feed()); };
const onPetDone = () => playPetTick();

new InputController(canvas, carrotBtn, {
  onPetTick: playPetTick,
  onPetDone,
  onFeed,
  onInteract,
  getRabbitRect: () => renderer.getRabbitRect(), // drag-feed drop target (whole body)
  getHeadRect: () => renderer.getHeadRect(),    // pet target (head + ears only)
}).attach();

muteBtn.addEventListener("click", () => {
  onInteract(); // allow unmuting-by-click to also be the audio unlock gesture
  store.save({ muted: !store.data.muted });
  sound.setAmbienceMuted(store.data.muted);
  sound.lastChirrup = 0;
  syncMute();
});

// battery politeness: no audio while the tab is backgrounded
document.addEventListener("visibilitychange", () => sound.setHidden(document.hidden));

// --- sizing + main loop ---
const fit = () => renderer.resize(canvas.clientWidth, canvas.clientHeight);
if ("ResizeObserver" in window) new ResizeObserver(fit).observe(document.documentElement);
else window.addEventListener("resize", fit);
fit();
syncFed();
syncMute();

let last = performance.now();
const frame = () => {
  const t = performance.now();
  const dt = Math.min(0.05, (t - last) / 1000); // clamp: background tab jumps are not physics
  last = t;
  state.update(dt);
  if (!document.hidden) renderer.draw(state);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

// debug/verification hook for browser smoke checks (harmless; no network, no DOM mutation)
globalThis.__rabbit_game = { state, sound, store, renderer };
