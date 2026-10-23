# ADR-0001: Reuse the precursor's hybrid ComfyUI orchestration (comfy-cli + comfy-mcp via LeanCTX)

**Status:** Accepted · 2026-10-23
**Adapted from:** `space-adventure-prototype/docs/design/space-adventure-prototype/art/adrs/ADR-0001-comfyui-orchestration.md`

**Context:** rabbit-game needs agent-operable, provenance-tracked art for a tiny
browser toy. The sibling repo already installed and validated a working stack:
ComfyUI as orchestration layer, comfy-cli-managed install, official comfy-mcp
wrapped through a LeanCTX addon, with a paid-cloud spend interlock.

**Decision:**
1. rabbit-game reuses the existing machine-level install (`~/AI/comfy/ComfyUI`,
   comfy-cli 1.20.0, comfy-mcp 0.10.0 via LeanCTX addon) — no second ComfyUI install.
2. Workflow artifacts for this project live in-repo under
   `docs/design/rabbit-game/art/workflows/` and are synced into a project-specific
   workspace subfolder (`rabbit/`), never shared silently with the precursor's.
3. Runtime art output targets the repo's `assets/` folder (the browser page's
   own static files), not any Godot/Popochiu structure.
4. Paid-cloud generation remains fail-closed; explicit user instruction required per session.

**Consequences:**
- (+) Zero new infrastructure; pipeline shape already proven end-to-end.
- (+) Same file-based, hashable workflow artifacts → same provenance model.
- (−) Project-specific workflow hygiene is on us (sync step, subfolder) — handled in ART-SETUP adaptation plan.

**Rejected:** A second ComfyUI install for this repo (disk + maintenance waste);
SaaS-only generation (no provenance/store interlock); having no pipeline and shipping AI art untracked (violates AGENTS hard constraints).
