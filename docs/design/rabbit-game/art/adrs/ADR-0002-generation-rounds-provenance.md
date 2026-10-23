# ADR-0002: Immutable generation rounds with shotkit critique + provenance; browser as the final consumer

**Status:** Accepted · 2026-10-23
**Adapted from:** `space-adventure-prototype/docs/design/space-adventure-prototype/art/adrs/ADR-0004-generation-rounds.md`

**Context:** The shotkit methodology (proven in the precursor's SHOTKIT brand
phase and asset pipeline) provides immutable rounds, pixel-verified critique
(ACCEPT/REVISE/REJECT), hash-based provenance, and file-based artifacts. rabbit-game
adopts the same discipline, replacing the Godot promotion target with the
browser's static asset tree, and adding a spritesheet manifest need (Q-012).

**Decision:**
1. Every asset lives at `art/production/<asset-id>/spec.yaml`; every generation
   attempt is an immutable round directory `generations/round-NNN/` containing
   request.json, workflow.json, generation.json, output.png. A revision is a NEW
   round — rounds are never edited or overwritten.
2. Critiques live at `critiques/round-NNN.critique.json` using the shotkit
   critique schema (verdict ACCEPT/REVISE/REJECT, issues with fix_type). The
   critic must read the actual image pixels; metadata-only verdicts are invalid.
3. Acceptance: `accepted/` records the winning round (acceptance.json +
   promotion.json). The promotion script copies artifacts into `assets/` and
   records the promotion in provenance — same hash-equality validation as the precursor.
4. Final game format: spritesheet PNG + JSON frame manifest (format defined by
   QUESTIONS Q-012) produced by the derivation step; the browser Renderer
   consumes only the manifest — never raw generation output.
5. Repo hygiene: round PNGs are gitignored per policy; specs, critiques,
   acceptance records, hashes, and manifests are committed (precursor precedent).

**Extras specific to rabbit-game:**
- Placeholder art (`assets/placeholder/`) is the only art permitted outside the
  pipeline and may never be part of a v1 release (AGENTS hard constraint).
- Favicon counts as an asset and follows the same pipeline (spec → rounds → accept → promote).

**Consequences:** (+) full audit trail; no silent art swaps; promotion is a
conscious validated step. (−) round-directory count grows (acceptable; gitignored
heavy PNGs, committed hashes/specs keep the repo light).

**Erratum process:** like the precursor, corrections to this ADR are recorded
inline as dated errata rather than silent rewrites.
