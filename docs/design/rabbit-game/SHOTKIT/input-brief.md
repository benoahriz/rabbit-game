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

NOT STARTED. Plan (once Q-002 style question is answered or answered by this research):

- Collect 2–3 interaction-style exemplars per candidate direction (pixel-art handheld
  pets vs smooth kawaii pet apps), noting source links and fetch dates.
- Extract brand-lock (palette roles, mood, character rules) with the
  brand-lock-extractor skill, writing `SHOTKIT/brand-lock.md`.
- Snapshot a hash-locked copy at `SHOTKIT/brand-lock.snapshot.md` (precursor pattern)
  for round reproducibility; record runs in `SHOTKIT/run.json` when generation begins.

## 4. Generator/format notes (carried from precursor run.json)

- Board type precedent: `game-asset-contact-sheet`; aspect 16:9 — for this toy,
  canvas/frame aspect TBD with Q-002 (likely square-ish or 16:10 scene).
- Generator precedent: two-pass rounds (e.g., gpt-image + nano-banana) with
  per-round hashed prompts; critique rounds with verdicts; final frame sets
  assembled per round. Same schema reused here when asset production starts.
