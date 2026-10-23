---
date: 2026-10-23
tags: [status/draft, type/system-design, doc/questions]
status: draft
created: 2026-10-23 01:38
updated: 2026-10-23 01:38
design: rabbit-game
doc: QUESTIONS
---
# rabbit-game — Open Questions
Tracks decisions, uncertainties, and deferred topics across development iterations.
Add entries here immediately when a decision is made or a question surfaces — never lose a decision.
---
## Status Legend
| Badge | Meaning |
|---|---|
| 🟢 **OPEN** | Active question — needs an answer before or during implementation |
| ✅ **ANSWERED** | Resolved — answer recorded inline |
| 🟡 **DEFERRED** | Not blocking current version — revisit later |
| 🔴 **OUT OF SCOPE** | Explicitly excluded — rationale recorded |
---
## Architecture & Design
---
### Q-001 — What is the rabbit's name / game's page title?
"rabbit-game" is the repo and design name; the toy itself wants a cute title
(page `<title>`, maybe spoken/sound-referenced nowhere in v1).
**Context:** Affects page banner, favicon metadata, and brand-lock extraction.
**Options:**
- A) Keep "Rabbit" generic and simple — "Rabbit." as the title.
- B) Pick a name-only pet name (e.g. "Clover", "Biscuit") — reserving character lore.
**Blocking?** No — repo stays `rabbit-game`; cosmetics only. Resolve by v0.2 art pass.
---
### Q-002 — Art style: pixel art or smooth kawaii illustration?
The toy must feel cute and warm. The precursor repo (`space-adventure-prototype`)
validated a pixel-art pipeline (356×200 logical viewport, sprite derivations); but
a pet toy may suit soft, rounded illustration instead.
**Context:** This decision is the single biggest input to the SHOTKIT brand-lock,
ART-BIBLE, and sprite spec formats. It must be decided before any generation round.
**Options:**
- A) Pixel art chunky sprites (proven pipeline; retro-toy charm; smaller asset sizes).
- B) Smooth kawaii illustration (rounder, pastel, "app plushie" feel; needs Medium resolution + scaling rules).
- C) Decide via a SHOTKIT reference-research round: collect 2–3 style exemplars per option as `SHOTKIT/input-brief.md` material and pick from extract.
**Blocking?** Yes for the art pipeline start (ADR and brand-lock depend on it). Not blocking for v0 engine bootstrap.
> ✅ **ANSWERED** · 2026-10-23
**Answer:** B) Smooth kawaii illustration — user decision. Consequences:
- ART-BIBLE §2 rewritten for kawaii rules (flat pastels, rounded shapes, soft outlines, smooth resampling — never pixel-filtered).
- `style-lock.yaml` style_flags updated (provisional until brand-lock).
- Q-011 calibration must compare models suited to flat illustration (SD-Turbo leans photoreal — a poor fit).
- Brand-lock reference exemplars target kawaii pet apps / plush-illustration aesthetics.
---
### Q-003 — Code layout: single-file `index.html` or split source tree?
**Context:** No build step is a hard constraint per PRD. Options balance
readability, caching, and "just looks at it once."
**Options:**
- A) Split: `index.html`, `styles/main.css`, `scripts/*.js (ES modules)`, `assets/` — better diffing and code review by agents.
- B) Single file: everything inline — trivially portable, but review-diff noise.
**Blocking?** No — but must be set before v0 bootstrap commit.
> ✅ **ANSWERED** · 2026-10-23
**Answer:** A) Split layout — user decision ("do what you recommend"). Repo root IS
the shipped artifact: `index.html` + `styles/` + `scripts/*.js` (native ES modules)
+ `assets/`. Served by any static server; never bundled.
---
### Q-004 — Sounds: synthesized WebAudio ("cute noises") vs recorded samples?
**Context:** PRD already constrains v1 to synthesized; recorded cute-noise samples
(licensed or generated via audio-vfx skills) may sound warmer than oscillators.
**Options:**
- A) WebAudio synthesis only in v1 (0 audio assets, guaranteed no licensing).
- B) Recorded/generated SFX (WAV/OGG) promoted through the same art pipeline with a `sound/` variant.
**Blocking?** No for v1 start; revisit if synthesis sounds flat.
**Resolution direction:** (A) for v1; keep a Sound interface crisp so (b) swaps in behind the same entry points.
---
### Q-005 — How much state persists between sessions?
**Options:**
- A) Only `muted` flag.
- B) `muted` + fed-count + optional rabbit name ( affection display).
- C) Full pet state (last-seen timestamp, mood) — risks creep toward sim territory.
**Blocking?** No.
**Resolution direction:** (B) cheap, cute, no sim baggage.
---
### Q-006 — Repertoire of "cute noises" (scope for the sound engine)?
**Context:** Need grounded palette of sounds so they amplify, not annoy.
**Proposed starting set (v0.1):** happy nibble (eating), content chirrup
(petted), soft idle blink, tiny hiccup when fed twice quickly.
**Blocking?** No — tune during prototype.
---
### Q-007 — Is a pet-name input acceptable in v1 (typing text)?
**Context:** Adds one DOM input; optional user value.
**Options:**
- A) No typing in v1 — pure tap toy (leaner a11y surface).
- B) Optional "name your rabbit" (persists; fun moment of attachment).
**Blocking?** No.
**Resolution direction:** Defer name input to v2 (simpler a11y in v1).
---
## Testing & Release
---
### Q-008 — Test tooling for the browser toy?
**Context:** No build step also means minimal test infra. Interaction smoke
tests (pet without errors, feed increments counter, mute persists) need a driver.
**Options:**
- A) Playwright (npm dev-dependency, not in runtime), headless smoke tests over a static server.
- B) Manual checklist only (violates "agent-operable release" ethos).
- C) Playwright minimal + `node --test`-based unit tests of pure modules (state machine, input classifier).
**Blocking?** No — but tests should exist before v0.1 is called done.
**Resolution direction:** (C) — light and honest.
---
### Q-009 — Publishing target for v1 (where does the URL live)?
**Context:** "Upload to GitHub when basics exist" — GitHub Pages is the natural free static host.
**Options:**
- A) GitHub Pages from repo root (no `package.json` build needed).
- B) Keep local-only; share via zip.
**Blocking?** No — decide by start of v0.3/v1 release.
**Resolution direction:** (A).
---
### Q-010 — Offline behavior in v1: plain static hosting vs PWA installability?
**Context:** Static assets load once; after that, refresh needs network unless a
service worker caches. PWA manifest + SW adds scope and versioning discipline.
**Blocking?** No.
**Resolution direction:** 🔴 OUT OF SCOPE for v1; DEFERRED to v2. Revisit PRD §7.
---
## Art & Audio Pipeline
---
### Q-011 — Do we pin the same ComfyUI model (SD-Turbo) as the precursor repo?
**Context:** Precursor pinned SD-Turbo fp32 locally under a disk gate. Style
decision (Q-002) may prefer a different model family (e.g., one closer to soft
illustration output) — choosing early wastes generations.
**Blocking?** Yes for generation-start (ADR-0003-equivalent).
**Resolution direction:** After Q-002 style decision, run a small model-compare
calibration round with 2–3 candidate models before pinning.
---
### Q-012 — Sprite derivation format: spritesheet layout spec?
**Context:** Browser renderer wants one PNG spritesheet + JSON frame manifest.
Precursor derive pipeline outputs transparent PNGs at target scale — extend to
row/column layout spec so the renderer stays dumb.
**Blocking?** Yes before v0.2 art promotion.
**Resolution direction:** Define `derivations/spritesheet.json` manifest format
(frames grid, anchor, playback fps), mirroring precursor `art/derivations/*.json` pattern.

## References
- Keep this section current as decisions change.
- Store supporting material in `references/` under this design directory.
- Precursor pipeline conventions: `space-adventure-prototype` docs, `art/adrs/ADR-0001..0004`, `art/ART-SETUP.md`.
