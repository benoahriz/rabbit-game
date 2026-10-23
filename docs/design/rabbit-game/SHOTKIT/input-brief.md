---
date: 2026-10-23
tags: [status/draft, type/system-design, doc/reference]
status: draft
created: 2026-10-23 01:38
updated: 2026-10-23 01:38
design: rabbit-game
doc: SHOTKIT-BRIEF
---

# SHOTKIT input brief — rabbit-game (seeded)

Source material for the brand-lock extraction phase. Modeled on the precursor's
`SHOTKIT/input-brief.md` (`space-adventure-prototype/docs/design/space-adventure-prototype/SHOTKIT/input-brief.md`).

**Status:** SEEDED — sections 1–2 filled from this session; section 3 (reference
research) NOT STARTED; extraction itself awaits Q-002 (art style decision).

## 1. User direction (verbatim intent)

- "more like choice 3 but it is going to be super super simple we just want to be
  able to feed the rabbit carrots and pet it and then it responds with cute
  noises the rabbit will be animated a little when you pet or feed it"
- Pure HTML cross-platform game that runs in the browser; repo will become a
  GitHub project later.
- Design docs live in `docs/design` in this repo.
- Reuse workflow ideas from `space-adventure-game-prototype`: the shotkit and
  comfyui workflows.

## 2. Game facts (from this repo/session)

- Working title: `rabbit-game` (no final name — QUESTIONS Q-001).
- Genre: virtual-pet toy (feed + pet + cute noises + light idle animation). No
  sim meters, no death, no scores.
- Runtime: vanilla HTML/CSS/JS, no build step, no runtime network; Canvas 2D +
  WebAudio; Pointer Events; localStorage persistence (mute, fed count).
- Targets: desktop (Chromium/Firefox/Safari) + mobile (iOS Safari / Android
  Chrome) with one code path.
- Art target: one rabbit + carrot + calm single scene; spritesheet + frame
  manifest (Q-012); favicon included in pipeline.
- Audio: WebAudio synthesized cute noises in v1; recorded SFX possible later (Q-004).

## 3. Reference research

Fetched 2026-10-23, in service of Q-002 (resolved: smooth kawaii illustration, option B).

### Tamagotchi (Bandai, released 23 Nov 1996)

Sources: Wikipedia `en.wikipedia.org/wiki/Tamagotchi` (fetched 2026-10-23); Japan House LA,
"How Tamagotchi Changed Digital Design" (Apr 2026, 30th-anniversary context).

- The original digital pet: egg-shaped keychain form, tiny screen; noted for its
  **simple design** and the novel act of "raising a digital pet."
- **We deliberately diverge** on its core loop: Tamagotchi's need-pressure and loss
  states are exactly what our PRD forbids (§7–8). The exemplar supports the
  "digital pet companion" framing, and our never-list gets sharper against it —
  "patient not demanding" is defined in contrast to Tamagotchi's nagging loop.

### Neko Atsume: Kitty Collector (Hit-Point, 2014)

Sources: NYT, "Why Am I Obsessed With a Cellphone Game About Collecting Cats?"
(2016-02-18); Google Play listing (fetched 2026-10-23); game-design breakdown
(alexiamandeville.medium.com, "The Simplicity of Neko Atsume").

- The closest published analog to our toy's intent: a single soft scene, flat
  pastel illustration, and famously **low pressure** — the NYT calls it
  "barely a game at all." The appeal is ambient companionship + tiny delight
  loops, identical to our idle loop and reaction cadence.
- Supports our color-grade anchor: flat, light-filled rooms (see brand-lock).

### Kawaii design principles (cross-source)

Sources: Kittl "Kawaii design: 5 characteristics" (`kittl.com/blogs/kawaii-design-guide`,
fetched 2026-10-23); Wikipedia "Kawaii" (fetched 2026-10-23); IASDR design-research
paper on kawaii as interface grammar (stroke weight/curvature → perceived softness).

- Five core elements: **roundness and softness; minimal facial features; pastel
  palettes; whimsical typography; (sub-genre restraint)** — our ART-BIBLE §2 rules
  map 1:1 onto these.
- Kawaii palette geometry: soft pastel pink/blue/white dominant, rounded shapes,
  vulnerability-evoking (baby-schema) features — supports our large head-to-body
  ratio and glossy dot eyes.
- The curvature/stroke-weight finding backs the "soft-inked not black-lined" rule
  and the soft-outline style flag.

## 3.1 Extraction status

`SHOTKIT/brand-lock.md` is WRITTEN (v1.0, 2026-10-23) per brand-lock-extractor:
- Palette: extracted from the live v0.1 placeholder build (real source hexes).
- Several fur tones + typography flagged `needs confirmation` — optional user
  review before the v0.2 generation rounds.
- `brand-lock.snapshot.md` (hash-locked copy) is created only after flagged
  values are confirmed — right before the first storyboard/generation run.

## 4. Generator/format notes (carried from precursor run.json)

- Board type precedent: `game-asset-contact-sheet`; aspect 16:9 — for this toy,
  canvas/frame aspect TBD with Q-002 (likely square-ish or 16:10 scene).
- Generator precedent: two-pass rounds (e.g., gpt-image + nano-banana) with
  per-round hashed prompts; critique rounds with verdicts; final frame sets
  assembled per round. Same schema reused here when asset production starts.
