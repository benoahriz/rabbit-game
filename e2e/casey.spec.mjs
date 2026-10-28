// e2e/casey.spec.mjs — the manual verification record, automated.
// Mirrors the 2026-10-23..25 playwright-session asserts + everything shipped since.
import { test, expect } from "playwright/test";

const URL = "http://127.0.0.1:8931/";

async function fresh(page) {
  await page.goto(URL, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1700);
}

test("boots clean: casey title, art fully loaded, zero console errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await fresh(page);
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const r = window.__rabbit_game?.renderer;
      return r && !!r.sceneImg && !!r.rabbitSprite && !!r.frames;
    });
    if (ready) break;
    await page.waitForTimeout(500);
  }
  expect(await page.title()).toBe("casey");
  const st = await page.evaluate(() => {
    const r = window.__rabbit_game.renderer;
    return { scene: !!r.sceneImg, rabbit: !!r.rabbitSprite, frames: !!r.frames };
  });
  expect(st).toEqual({ scene: true, rabbit: true, frames: true });
  expect(errors).toEqual([]);
});

test("F feeds: eating state, counter, persistence", async ({ page }) => {
  await fresh(page);
  await page.keyboard.press("F");
  await page.waitForTimeout(250);
  const st = await page.evaluate(() => ({
    state: window.__rabbit_game.state.state, fed: window.__rabbit_game.state.fed,
  }));
  expect(st.state).toBe("eating");
  expect(st.fed).toBe(1);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__rabbit_game.store.data.fed)).toBe(1);
});

test("a head stroke melts her into happy", async ({ page }) => {
  await fresh(page);
  const head = await page.evaluate(() => {
    const h = window.__rabbit_game.renderer.getHeadRect();
    return { x: h.x + h.w / 2, y: h.y + h.h / 2 };
  });
  await page.mouse.move(head.x - 60, head.y, { steps: 2 });
  await page.mouse.down();
  for (let i = 0; i <= 12; i++) {
    await page.mouse.move(head.x - 60 + i * 11, head.y + Math.sin(i) * 2, { steps: 1 });
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  expect(await page.evaluate(() => window.__rabbit_game.state.state)).toBe("happy");
});

test("corner button opens the menu; picker swaps; ESC parity; backdrop closes", async ({ page }) => {
  await fresh(page);
  await page.click("#menu-btn");
  expect(await page.evaluate(() => !document.getElementById("menu").hidden)).toBe(true);
  expect(await page.evaluate(() => document.getElementById("menu-btn").getAttribute("aria-expanded"))).toBe("true");
  await page.click("#opt-room");
  expect(await page.evaluate(() => window.__rabbit_game.renderer.setting)).toBe("room");
  await page.mouse.click(60, 60); // backdrop
  expect(await page.evaluate(() => document.getElementById("menu").hidden)).toBe(true);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => !document.getElementById("menu").hidden)).toBe(true);
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => document.getElementById("menu").hidden)).toBe(true);
});

test("captions: off by default; Extras toggle voices her words", async ({ page }) => {
  await fresh(page);
  expect(await page.evaluate(() => window.__rabbit_game.store.data.captions)).toBe(false);
  await page.keyboard.press("F");
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.querySelectorAll("#bubbles .bubble").length)).toBe(0);
  await page.click("#menu-btn");
  await page.click("#opt-captions");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await page.keyboard.press("F");
  await page.waitForTimeout(320);
  const bubbles = await page.evaluate(() => [...document.querySelectorAll("#bubbles .bubble")].map(b => b.textContent));
  expect(bubbles.some(t => t.includes("nom"))).toBe(true);
});

test("clock & calendar: off default; chip shows; today circled; nav holds", async ({ page }) => {
  await fresh(page);
  expect(await page.evaluate(() => document.getElementById("clock-chip").hidden)).toBe(true);
  await page.click("#menu-btn");
  await page.click("#opt-clock");
  await page.keyboard.press("Escape");
  expect(await page.evaluate(() => !document.getElementById("clock-chip").hidden)).toBe(true);
  await page.click("#clock-chip");
  expect(await page.evaluate(() => !!document.querySelector(".cal-day.today"))).toBe(true);
  await page.click("#cal-next");
  const afterNav = await page.evaluate(() => document.getElementById("cal-label").textContent);
  await page.waitForTimeout(1600);
  expect(await page.evaluate(() => document.getElementById("cal-label").textContent)).toBe(afterNav);
});

test("dozing: injected timer → doze frame; F wakes her", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { window.__rabbit_game.state.dozeAfterMs = 700; });
  await page.waitForTimeout(1600);
  expect(await page.evaluate(() => window.__rabbit_game.state.dozing)).toBe(true);
  expect(await page.evaluate(() => window.__rabbit_game.renderer._spriteUsed)).toBe("doze");
  await page.keyboard.press("F");
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__rabbit_game.state.dozing)).toBe(false);
});

test("boop the nose: a heart pops", async ({ page }) => {
  await fresh(page);
  const nose = await page.evaluate(() => window.__rabbit_game.renderer.getNosePoint());
  await page.mouse.click(nose.x, nose.y);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__rabbit_game.renderer._fx.some(f => f.kind === "heart"))).toBe(true);
});

test("the golden carrot: one in eight drags shimmers and celebrates", async ({ page }) => {
  await fresh(page);
  // force the rare roll for the next ghost creation, then drag to the mouth
  await page.evaluate(() => {
    const orig = Math.random;
    Math.random = () => 0.01;
    window.__restoreRandom = () => { Math.random = orig; };
  });
  const basket = await page.locator("#basket").boundingBox();
  const rabbit = await page.evaluate(() => window.__rabbit_game.renderer.getRabbitRect());
  await page.mouse.move(basket.x + basket.width / 2, basket.y + basket.height / 2);
  await page.mouse.down();
  await page.mouse.move(rabbit.x + rabbit.w / 2, rabbit.y + rabbit.h / 2, { steps: 8 });
  await page.mouse.up();
  await page.evaluate(() => window.__restoreRandom());
  expect(await page.evaluate(() => window.__rabbit_game.renderer.goldCarrot)).toBe(true);
  await page.waitForTimeout(1900); // EAT_MS passes → gold returns to the basket
  expect(await page.evaluate(() => window.__rabbit_game.renderer.goldCarrot)).toBe(false);
});

test("the return greeting: voice line plays through the real event", async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { window.__rabbit_game.store.save({ captions: true }); });
  await page.mouse.click(10, 10); // unlock
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(3600);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__rabbit_game.sound._playingClips.has("greet"))).toBe(true);
  const bubbles = await page.evaluate(() => [...document.querySelectorAll("#bubbles .bubble")].map(b => b.textContent));
  expect(bubbles.some(t => t.includes("see you again"))).toBe(true);
});
