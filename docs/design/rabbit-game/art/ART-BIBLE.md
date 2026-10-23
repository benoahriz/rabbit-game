# Art Bible — rabbit-game

> system-forge workstream: Pure-web virtual pet (rabbit) · art pipeline adapted from `space-adventure-prototype`
> Status: Draft v0.2 · 2026-10-23 · style locked: **smooth kawaii illustration** (Q-002 ✅)
> Machine-readable companion: [`style-lock.yaml`](style-lock.yaml) (stub until brand-lock extraction)
> Brand phase: [`../SHOTKIT/input-brief.md`](../SHOTKIT/input-brief.md) → brand-lock extraction pending

## 1. Visual Identity (provisional)

A tiny, warm virtual-pet toy: one illustrated rabbit on a soft single-scene page,
fed and petted by the visitor. The emotional target is "digital plushie" — gentle,
patient, always pleased to see you.

**One-line visual thesis:** a soft, rounded little rabbit resting on a calm pastel
surface — every interaction rewards the player with visible, audible delight.

**Canon character identity (Q-014 ✅ · 2026-10-23):** derived from a user-supplied
reference (`art/calibration/bunny-style-options/references/`, round-003 R3):
plump white bunny, **thick warm brown outline**, matte pink bow on the ear,
glossy dark-brown eyes, soft pink blush, round tail, visible paw pads.
**Canon scene (Q-015 ✅ · 2026-10-23):** cozy Japanese tea garden, tsukubai
corner — bamboo spout trickling into a stone basin, moss mounds, stone lantern,
cherry branch, muted moss greens + dusty pinks + cream hush.

## 2. Rendering Style (locked: smooth kawaii illustration)

Decision (Q-002 ✅ · 2026-10-23): smooth kawaii illustration — pixel art is set aside.

- **Medium:** flat pastel vector-look illustration with very soft shading; plushie/app-pet softness, not retro sprites.
- **Shapes:** rounded primitives everywhere — spheres, ovals, capsules; no hard corners; silhouette reads as a plush toy.
- **Outlines:** thin-and-soft OR, for the canon character, **thick warm brown** —
  the user's reference pick (Q-014, 2026-10-23) overrides the earlier
  "minimal to none" lean. Never pure black ink of uniform weight.
- **Resampling:** canvas `scale_mode` is smooth (bilinear); NEVER nearest-neighbor/pixelate.
- **Shading:** gentle one-step shading (soft airbrush-style), plus simple blush marks and highlight dots for kawaii cues.
- **Expression economics:** eyes are simple glossy dots/ovals; mouth tiny "ω"/"u" curves; charm from proportions (large head-to-body ratio) over detail.
- **Texture:** flat clean fills; no noise, no painterly grain, no photorealism, no 3D-render sheen.

## 3. Palette (extracted 2026-10-23 — provisional from v0.1 build)

Extracted from the live v0.1 build by the brand phase; every hex lives in
[`../SHOTKIT/brand-lock.md`](../SHOTKIT/brand-lock.md). Canonical machine copy: [`style-lock.yaml`](style-lock.yaml).

| Role | Hex |
|---|---|
| Background (wall) | `#FDF2F6` |
| Floor | `#F7E3EC` |
| Rabbit fur primary | `#F7DFE7` |
| Rabbit fur highlight (belly/paws) | `#FFF2F5` |
| Inner ear / soft shade | `#F3CDD8` (backs), `#FBD9E3` (deep inner) |
| Ink (eyes/mouth — soft plum-brown, never black) | `#4A3B41` |
| Nose base | `#E88CA4` (blush = same family at reduced opacity) |
| Carrot (ONLY warm accent per frame) | `#F2803C` |
| Carrot leaf | `#6BBF59` |

Known required roles from the game design (all now covered):
- Background/scene surface ✓, rabbit fur set ✓, accent set ✓
- Reserved **fur-swap role set** for the IDEA-007 palette-swap concept (empty until v2)
- Interaction highlight = the Ink role; no glow substitutes (bloom hard-false)

**Canon palette update (pending master sampling):** the picked character is
WHITE-furred (not pink-furred) with warm brown outline ink and a matte pink
bow; the picked scene is muted moss greens + dusty pinks + cream hush. Hex
values are auto-sampled at master acceptance and re-pinned into
[`style-lock.yaml`](style-lock.yaml) — the table above stays as the v0.1 page-
chrome (background/floor/UI) palette, which remains valid for CSS roles.

## 4. Lighting

Flat, soft, warm. No dramatic lighting, no bloom, no lens flares, no glow
effects. Optional gentle vignette decided at brand-lock.

## 5. Character Rules (rabbit)

**Canon identity (Q-014 ✅ — round-003 R3 `r3-fullbody-flat-matte`, user pick).**
- Plump white bunny; thick warm brown outline; matte pink bow (ear); glossy
  dark-brown eyes; soft pink blush; plump body with visible small paws, paw
  pads, and round tail; sitting upright, facing forward.
- Reference provenance: user-supplied image, archived at
  `art/calibration/bunny-style-options/references/` (gitignored locally,
  sha256 in round-003 `generation.json`).
- **Expression set:** calm `ω` idle, blink, wink + open-mouth smile (happy
  interactions), eating chomp, ear twitch. The wink + open smile is the
  signature "reward" face from the reference.
- Readable silhouette at small scale (ensure cuteness survives 375 px-wide phone viewport).
- Animation budget (v1): idle breathing loop, blink, ear-twitch, eating chomp
  (4–6 frame), happy wiggle/hop (4–6 frame), one optional stretch/flop (v2, IDEA-005).

## 6. Environment Rules

**Canon scene (Q-015 ✅ · AMENDED same day — user direction).**
Cozy Japanese tea garden, style-aligned to the canon character (thick warm
brown outlines, flat matte pastel fills). Required water content:
**rock-formation water feature — koi pool fed by a bubbler that bubbles up and
overflows water from the rocks** into the pond, plus a **meandering stream
running beside the stone pathway**. Moss
mounds, stone lantern, cherry accents, muted moss greens + dusty pinks + cream
hush. The ambience audio (Q-013 ✓) reads as this scene's trickle + bubbling.

Single scene **per environment** (two-environment system, user scope amendment
2026-10-23): the **garden** — full-bleed, quiet rest band center-left, water
feature mid-right as the interest anchor (and the visual anchor of the
trickling ambience, Q-013 ✓) — and the **pink room** (`assets/scene/pink-room.png`,
Q-env: interior with empty center rug; rabbit CENTERED there vs off-center left
in the garden). Switched via the ESC settings menu (PRD UC-6). Within each
environment the composition rules stay strict: quiet rest space for the rabbit,
below-neutral noise elsewhere. Feed affordance (carrot) must be findable within
2 seconds by a first-time phone visitor. No competing characters, objects, or
weather in v1.

## 7. Non-Negotiables (carried from PRD/AGENTS)

- Final art comes ONLY from the tracked pipeline (`art/` ADRs) with provenance.
- No bloom/glow effects; no photorealism; no stock art; no protected characters.
- All art machine-readable via `style-lock.yaml`; palette roles named, hex values pinned.
