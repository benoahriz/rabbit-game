# Reference: art-pipeline precedent (space-adventure-prototype)

> Purpose: record exactly which conventions rabbit-game carries over from the
> sibling repo, and where each comes from. Read-only reference; the sibling repo
> is untouched.

Source repo (local checkout): `../space-adventure-prototype/`

## Conventions adopted (with source paths)

| Adopted into rabbit-game | Precursor source |
|---|---|
| Design docs at `docs/design/<repo>/` with dated doc types | `docs/design/space-adventure-prototype/` (graduated system-forge layout) |
| Full doc kit: PRD, QUESTIONS, ROADMAP, IDEAS, AGENTS, HANDOFF | same folder |
| Art subdesign: `art/ART-BIBLE.md` + `art/style-lock.yaml` + `art/ART-SETUP.md` | `docs/design/space-adventure-prototype/art/` |
| ADR set: ComfyUI orchestration + immutable generation rounds | `docs/design/space-adventure-prototype/art/adrs/ADR-0001`, `ADR-0004` |
| SHOTKIT phase folder (input-brief, brand-lock + snapshot, run.json) | `docs/design/space-adventure-prototype/SHOTKIT/` |
| Art tree: calibration / production (spec→rounds→critiques→accepted) / derivations | `art/` (repo root) |
| Promotion target = runtime asset folder (here `assets/`, there Godot `assets/`) | `art/adrs/ADR-0004` (incl. erratum) |
| Agentic hygiene: repo AGENTS.md, pinned versions doc, doctor/test/run scripts | precursor root `AGENTS.md`, `docs/VERSIONS.md`, `scripts/` |

## Deliberately NOT adopted (runtime differences)

- Godot 4 / Popochiu / GdUnit4 / godot-editor-mcp toolchain — replaced by pure-web
  stack (Canvas 2D, WebAudio, Playwright for smoke tests).
- PRD/ROADMAP scale — precursor is a multi-room point-and-click; rabbit-game is a
  single-scene toy (see PRD §1 reason 2 and ROADMAP boundary principle).
- Predecessor visual identity (mechanic/droids/cruise freighter) — the art bible
  here is fresh; only methodology transfers, not style.

## Model/reuse notes

- ComfyUI + comfy-cli + comfy-mcp infrastructure is machine-level and reused,
  not copied (`art/ART-SETUP.md` "Reused infrastructure").
- Precursor site pinning conventions (`docs/VERSIONS.md`) recommended for the
  v0 bootstrap milestone.
