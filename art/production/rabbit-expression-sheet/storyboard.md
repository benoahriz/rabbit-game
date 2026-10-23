# rabbit-expression-sheet — beat sheet (storyboard)

> **Round:** production round-001 · **Date:** 2026-10-23
> **Discipline:** storyboard-architect adapted for game animation frames (ADOPT-20261023:
> adopt the workflow, not the stack). Video-shot schema (framing/VO/text overlays) does not
> apply to a sprite frame set; what transfers is: a locked series, explicit per-beat
> triggers + timing, a rationale per beat, and hash-pinned provenance (`generation.json`
> fills the `run.json` role in this pipeline per ADR-0002).

## Series lock

- **character:** canon r3 fullbody flat-matte bunny (source sha256 `1ef3fd2b…c15bb`),
  position/scale/pose/palette FROZEN — every frame must be swappable in-place.
- **environment:** none — the flat matte ground is keyed out at runtime (border flood-fill);
  frames must keep it uniform so the same key works.
- **lighting/color grade:** flat matte, thick warm brown outlines, pastel fills. No grade change.
- **budget:** 5 images ≈ $0.20 on the nano-banana lane (~$0.039/image, last lane record).

## Beats (frame specs)

| beat id | trigger (FSM signal) | duration | swap behavior | rationale |
|---|---|---|---|---|
| `blink-lash-closed` | `blink() > 0.6` (idle or eating) | 180 ms (`BLINK_MS`) | replaces the idle sprite; canvas lid overlay retires | canonical lash art beats a white-patch overlay; kills overlay-drift risk |
| `ear-twitch-fold` | `earTwitch()` active (idle) — signal currently unused on the art path | 1200 ms (`EAR_MS`) | replaces the idle sprite during the twitch window | first visible ear reaction since the placeholder era; ambient life without body motion |
| `chomp-mouth-closed` | `state === "eating"`, chomp phase closed | ~200 ms/phase (8 phases over `EAT_MS` 1600) | alternates with `chomp-mouth-open` while the carrot overlay + crumbs run | sells the bite cycle; pairs with same-frame munch crunch (Feel rule #2) |
| `chomp-mouth-open` | `state === "eating"`, chomp phase open | ~200 ms/phase | alternates with `chomp-mouth-closed` | the open half of the cycle gives the crunch somewhere to land |
| `happy-joy-face` | `state === "happy"` | 2000 ms (`HAPPY_MS`) | replaces the idle sprite for the damped hop + heart poof | happy currently reuses the idle face — the weakest read on the scorecard; a joy face pays off the player's pets |

## Acceptance (per spec.json)

Position/palette freeze is verified at critique by pixel-probe (content bbox within ~6 px
of the master, palette samples match, background uniformly keyable, expression legible
at game scale). A frame that drifts position is a REVISE — a teleporting bunny is worse
than no frame.

## Consumption plan (render.js, post-promotion)

1. Load expression frames alongside `rabbit-idle.png`, key them with the same border flood-fill.
2. Swap sprites on the FSM signals above; keep breathe/bounce/tilt math unchanged.
3. Retire the blink lid overlay; keep the carrot-at-mouth + crumb/heart particle FX.
4. lean-ctx ceiling note: runtime chroma-key stays until pre-baked alpha cutouts are
   produced offline (mechanical key script, allowed — not hand-drawn art).
