# rabbit-game

A tiny pure-HTML virtual-pet toy: feed the rabbit carrots, pet it, and it
responds with small animations and cute noises. Vanilla HTML/CSS/JS — no
framework, no build step, no runtime network. Runs in any modern browser,
desktop or mobile.

Status: **v0 bootstrap** — empty-scene shell + design foundation. Next: v0.1
playable toy (placeholder art/sound). See `docs/design/rabbit-game/ROADMAP-20261023.md`.

## Quickstart

Native ES modules need a static server (opening via `file://` blocks module loading):

```bash
python3 -m http.server 8000     # then open http://localhost:8000
# or use any static file server
```

## Layout

The repo root IS the shipped artifact (Q-003 ✅ — split layout, never bundled):

```
index.html          page shell
styles/             CSS
scripts/            vanilla JS ES modules (main.js, render.js; FSM/input/sound in v0.1)
assets/             pipeline-promoted final art (assets/placeholder/ until v0.2)
docs/design/rabbit-game/   system-forge design: PRD, QUESTIONS, ROADMAP, IDEAS, AGENTS, HANDOFF
art/                production tree (v0.2+): spec → immutable rounds → critique → accepted
```

## Design & pipeline

- `docs/design/rabbit-game/` — full system-forge design set.
- Art pipeline: shotkit brand phase (`docs/design/rabbit-game/SHOTKIT/`) + hybrid
  ComfyUI production (`docs/design/rabbit-game/art/`), adapted from the sibling
  `space-adventure-prototype` repo.
- Agent work rules: see `AGENTS.md` (root) and `docs/design/rabbit-game/AGENTS-20261023.md`.

## Constraints (enforced)

- No frameworks/bundlers/TypeScript; no runtime network requests; no analytics.
- Final game art is produced only through the tracked pipeline with provenance.
- No secrets — this repo becomes public.
