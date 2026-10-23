# Brand Lock: rabbit-game

## Identity

**Brand:** rabbit (working title — repo `rabbit-game`; final name pending QUESTIONS Q-001)
**One-line description:** A tiny browser toy where you feed a kawaii rabbit carrots and pet it, and it responds with small animations and cute synthesized noises.
**Archetype:** Caregiver (the toy cares for the visitor, never the reverse — no need-nagging mechanics)
**Voice posture:** Warm and Playful, hushed volume

## Palette

Every hex value here is allowed. Anything outside this list is not.

| Role | Hex | Use |
|---|---|---|
| Background | `#FDF2F6` | Wall/primary canvas (warm cream-pink) |
| Floor | `#F7E3EC` | Ground band, tonal second surface |
| Fur primary | `#F7DFE7` | Rabbit body/head base |
| Fur highlight | `#FFF2F5` | Belly patch, paws, brightest fills |
| Inner ear | `#F3CDD8` | Ear backs, soft inner shading |
| Ink | `#4A3B41` | Eyes, mouth, dark accents — soft dark plum-brown, never black |
| Accent (interaction pop) | `#F2803C` | Carrot body — the ONLY warm hero pop per frame |
| Leaf / secondary accent | `#6BBF59` | Carrot greens, tiny nature accents |
| Nose/blush base | `#E88CA4` | Nose; blush at reduced opacity |

## Typography

**Display font:** `system-ui Semibold 600` (provisional — placeholder build uses the OS stack; a bundled rounded display font is planned for v0.2, no runtime CDN fonts per AGENTS.md)
**Body font:** `system-ui Regular 400` (provisional, same constraint)

## Mood adjectives

- Plush not pixel — smooth rounded volumes, retro sprites explicitly rejected (Q-002)
- Patient not demanding — the rabbit never hungers, never guilt-trips; delight is freestanding
- Soft-inked not black-lined — dark accents are warm plum-brown `#4A3B41`, never uniform black strokes
- Hushed not flat — pastel depth from tonal steps between close values, not gradients or glow
- Delighted not performative — reactions are small and immediate (≤ 2 s one-shots), not confetti-spam

## Never list

- Never harsh uniform black/bootstrap-dark outlines or mega-saturated candy neon
- Never photorealism, 3D-render sheen, bloom, glow, or lens flares (hard false in style-lock)
- Never pixel-art/nearest-neighbor treatment of the final rabbit (pixel style was considered and rejected)
- Never urgency UI: no alarm reds, countdowns, hunger/health bars, or loss states
- Never stock clip-art cuteness or emoji as design elements (SVG icons in-app are structural UI, not art)
- Never more than one warm accent pop per frame (carrot orange is reserved for the interaction affordance)
- Never route font/color through runtime CDNs — the artifact is offline-first

## Aspect ratios

Default: 16:9 generation boards (scene/asset rounds); the game canvas itself is responsive full-viewport (portrait phones to desktop). 1:1 for favicon/share-card derivatives. 9:16 boards only if a vertical scene round is ever needed.

## Color grade direction

> Flat pastel illustration grade: two-step tonal shading per shape (base + one soft shade), tiny warm blushes, no bloom, no vignette heavier than a breath — reference: the flat, light-filled rooms of Neko Atsume.

## Motion language

> Fixed camera, zero camera moves; all motion lives in the character's body. One-shot reactions are springy and contained: squash-and-stretch-lite easing inside ≤ 2 s, then a settle back to the idle loop (slow breathe, blink every 2.6–5.2 s, rare ear twitch). No whip-pan, no parallax, no screen shake. `prefers-reduced-motion` collapses loops to static poses while interactions still work.

## Voice rules

- Sentence case everywhere; no exclamation points in any in-game copy
- UI strings ≤ 24 characters ("4 fed")
- Onomatopoeia (speech-bubble sounds, IDEA-002) is always lowercase — "nib nib", "pprr"
- Never speak need-state in copy: no "your rabbit is hungry"-style lines, ever
- Sound is described to players as cute noises — warm, small, never bossy

## Extraction notes

Audit trail for this extraction. Values not listed here were read directly from an asset (`extracted`).

**Extracted** (read directly from an artifact):
- All palette hexes — sampled from the running v0.1 build source (agent-authored placeholder renderer + accompanying script in the repo). The build has been verified working in-browser.

**Inferred** (reasoned from evidence, reasonable to ship):
- Caregiver archetype + "patient not demanding" mood — from PRD §8 Non-Goals (no sim meters, never dies/demands) and the "super super simple" brief.
- Never-list urgency/guilt entries — from PRD §7 out-of-scope (no hunger/health meters) and PRD §8.
- Aspect-ratio bias (responsive full-viewport; 16:9 boards) — from the resolved layout (Q-003) and scene composition.
- Motion language specifics (≤ 2 s one-shots; idle cadence 2.6–5.2 s blinks) — mirrors the v0.1 state machine constants (scripts/rabbit-state.js).
- Color-grade reference (Neko Atsume) — its single-scene, low-pressure, flat-pastel collecto space is the closest published analog to this toy's intent.
- Caregiver voice posture: warm/playful — derived from the user brief "cute noises" + "rabbit will be animated a little when you pet or feed it" (SHOTKIT/input-brief.md §1).

**Needs confirmation** (best estimate, please verify):
- Fur tones `#F7DFE7` / `#FFF2F5` / `#F3CDD8` / nose-blush `#E88CA4` — extracted from the placeholder build, which is intentionally temporary art; final pipeline art (v0.2) may restyle within these roles. Confirm or adjust after the first accepted generation round.
- Blush `#E88CA4`-family — the build renders blush at rgba(240,130,160,.25); the table row is the opaque equivalent; treat the hex as the base tone, not the on-screen alpha.
- Typography — display/body are the placeholder system stack; the bundled rounded display font (kawaii convention per exemplar research) is chosen in v0.2. Confirm final font pairing then.
- Color-grade reference — no published brand photography exists for this brand; the Neko Atsume anchor is a reasoned stand-in until the first accepted scene round grounds it.

---

**Last updated:** 2026-10-23
**Owner:** extracted
**Version:** 1.0
