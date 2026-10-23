# AGENTS.md — repo rules for AI agents (rabbit-game)

**Primary instructions: `docs/design/rabbit-game/AGENTS-20261023.md` — read it FIRST.**
Then `docs/design/rabbit-game/PRD-20261023.md` and the open questions in `QUESTIONS-20261023.md`.

## Constitutional rules (summary — full text in the design AGENTS doc)

1. **Pure HTML/CSS/vanilla JS, no build step.** No frameworks, bundlers, runtime
   npm packages, or TypeScript. Repo root IS the artifact (Q-003 ✅):
   `index.html` + `styles/` + `scripts/` (native ES modules) + `assets/`.
2. **Zero runtime network.** No CDNs, no fetched fonts, no analytics/telemetry.
3. **Art provenance is sacred.** Final assets only via the tracked pipeline
   (`docs/design/rabbit-game/art/adrs/ADR-0002`): spec → immutable generation
   rounds → pixel-verified critique → acceptance → promotion into `assets/`.
   Never hand-draw or silently substitute final art; never mutate a round.
4. **This repo becomes a public GitHub repo.** Never commit secrets or keys.
   Paid-cloud art generation requires explicit user instruction, every session.
5. **Doc hygiene.** New questions → `QUESTIONS-20261023.md` (next Q-NNN);
   ideas → `IDEAS-20261023.md`; at session end update the current `HANDOFF-*.md`.
   Keep every doc's References section current.
6. **Respect PRD §8 Non-Goals.** No sim meters (hunger/health/death), no accounts,
   no multiplayer, no monetization. Refuse and flag rather than implement.
7. **Proportionality.** Tiny toy, tiny code. Prefer deletion over abstraction;
   prefer the simplest vanilla mechanism that works.

## Conventions

- Commits: conventional commits (`feat:`, `docs:`, `chore:`, …).
- Provisional placeholders live in `assets/placeholder/` and may never appear in a v1 release.
- Prototype/exploration code goes to `prototypes/` with a header comment
  (`what it tests` + status WORKING/BROKEN/ABANDONED).
