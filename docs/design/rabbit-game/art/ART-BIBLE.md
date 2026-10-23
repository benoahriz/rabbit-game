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

## 2. Rendering Style (locked: smooth kawaii illustration)

Decision (Q-002 ✅ · 2026-10-23): smooth kawaii illustration — pixel art is set aside.

- **Medium:** flat pastel vector-look illustration with very soft shading; plushie/app-pet softness, not retro sprites.
- **Shapes:** rounded primitives everywhere — spheres, ovals, capsules; no hard corners; silhouette reads as a plush toy.
- **Outlines:** minimal to none; if used, thin and soft-tinted (never black ink of uniform weight).
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

## 4. Lighting

Flat, soft, warm. No dramatic lighting, no bloom, no lens flares, no glow
effects. Optional gentle vignette decided at brand-lock.

## 5. Character Rules (rabbit)

- Readable silhouette at small scale (320 px CSS-scale game canvas; ensure cuteness survives 375 px-wide phone viewport).
- Expression range needed for v0.1 → v0.2: calm idle, blink, eating (open/closed mouth), happy (closed/curved eyes), ear twitch.
- Animation budget (v1): idle breathing loop, blink, ear-twitch, eating chomp (4–6 frame), happy wiggle/hop (4–6 frame), one optional stretch/flop (v2, IDEA-005).

## 6. Environment Rules

Single scene. Center third dominated by resting rabbit; below-neutral visual
noise so the rabbit reads instantly. Feed affordance (carrot) must be findable
within 2 seconds by a first-time phone visitor. No competing characters,
objects, or weather in v1.

## 7. Non-Negotiables (carried from PRD/AGENTS)

- Final art comes ONLY from the tracked pipeline (`art/` ADRs) with provenance.
- No bloom/glow effects; no photorealism; no stock art; no protected characters.
- All art machine-readable via `style-lock.yaml`; palette roles named, hex values pinned.
