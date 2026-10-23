// rabbit-game v0 — boot: canvas, resize loop, provisional empty scene.
// Final art is pipeline-produced only (docs/design/rabbit-game/art/adrs/ADR-0002); nothing hand-drawn ships.
import { Renderer } from "./render.js";

const canvas = document.getElementById("scene");
const renderer = new Renderer(canvas);

const fit = () => renderer.resize(canvas.clientWidth, canvas.clientHeight);
if ("ResizeObserver" in window) {
  new ResizeObserver(fit).observe(document.documentElement);
} else {
  window.addEventListener("resize", fit);
}
fit();

const frame = (t) => {
  renderer.draw(t);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
