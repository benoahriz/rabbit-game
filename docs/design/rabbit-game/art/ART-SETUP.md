# Art Pipeline Setup & Developer Commands (hybrid ComfyUI — adapted)

Adapted from `space-adventure-prototype/docs/design/.../art/ART-SETUP.md` for a pure-web runtime.

> Workstream: rabbit-game art production · adapted from precursor ADR-0001..0004 → local `art/adrs/ADR-0001/ADR-0002`
> Status: Seeded v0.1 · scripts DO NOT EXIST YET — adapt precursor scripts in v0.2 (see "Adaptation plan")

## Reused infrastructure (already installed on this machine — do NOT reinstall)

| Component | Version | Location | Notes |
|---|---|---|---|
| ComfyUI | 0.34.0 | `~/AI/comfy/ComfyUI` | comfy-cli workspace; OUTSIDE macOS TCC folders |
| comfy-cli | 1.20.0 | `~/.local/bin/comfy` (uv tool) | COMFY_BIN target |
| comfy-mcp | 0.10.0 | `~/.local/bin/comfy-mcp` (uv tool) | official Comfy-Org server; via LeanCTX addon |
| LeanCTX addon | comfy-mcp | `~/.config/lean-ctx/config.toml` | precursor addon config; re-point workflows per project |
| Current local model | SD-Turbo fp32 | `~/AI/comfy/ComfyUI/models/checkpoints/sd_turbo.safetensors` | availability ≠ choice: model pin gated by Q-002 + Q-011 calibration |

Precursor environment references: `space-adventure-prototype/docs/design/space-adventure-prototype/art/ART-SETUP.md`.

## Endpoints / paths

- ComfyUI API: `http://127.0.0.1:8188` (localhost only, never LAN-exposed)
- Workspace: `~/AI/comfy/ComfyUI` (models/, input/, output/, user/default/workflows/)
- Curated workflows will live in-repo: `docs/design/rabbit-game/art/workflows/` and be copied into the workspace (one subfolder for this project, e.g. `rabbit/`) — do NOT share/reuse precursor workflow files without a review recorded here.

## Environment variables (never commit values)

- `COMFY_BIN` — absolute path to comfy binary (set at addon registration).
- `COMFY_API_KEY` — OPTIONAL, partner-API nodes only; Keychain or addon env injection, never plaintext.
- `COMFYUI_URL` — OPTIONAL; absence = local `127.0.0.1:8188`.

## Paid-cloud safety (unchanged from precursor)

`comfy run --allow-spend` interlock is NEVER passed by this repo's scripts. Cloud
capability discovery is allowed; paid generation requires explicit user instruction
per session.

## Planned directory contract (this repo)

```
art/                                    # production tree (repo root, like precursor)
  calibration/                          # per-scene guides + critique JSONs
  production/<asset-id>/spec.yaml       # one spec per asset
  production/<asset-id>/generations/round-NNN/   (immutable: request.json, workflow.json, generation.json, output.png)
  production/<asset-id>/critiques/round-NNN.critique.json
  production/<asset-id>/accepted/       (acceptance.json + promotion.json)
  derivations/<id>.json                 # sprite/derivation records
assets/                                 # FINAL runtime assets consumed by index.html (promotion target)
  placeholder/                          # v0.1 placeholder art (clearly labeled, never ships in v1)
docs/design/rabbit-game/art/            # design-side: ART-BIBLE, style-lock, ADRs, workflows/, specs vars
```

## Developer commands (adaptation plan — create in v0.2 by adapting precursor scripts)

```bash
# environment doctor (lean-ctx, comfy, browser toolchain)
./scripts/art_doctor.sh                       # adapt from precursor scripts/art_doctor.sh

# ComfyUI lifecycle (rely on comfy-cli directly)
comfy launch --background
comfy server_info

# sync curated workflows repo -> workspace
./scripts/art_sync_workflows.sh               # adapt

# generate a round (writes request.json/workflow.json/generation.json/output.png)
uv run python scripts/art_generate.py art/production/<asset>/generations/round-001

# validate provenance chain
uv run python scripts/art_validate.py --all

# promote accepted asset into app assets/ (validation enforced)
uv run --with pillow python scripts/art_promote.py <asset-id>

# derive final game-scale spritesheet + manifest (Q-012 format)
uv run --with pyyaml --with pillow python scripts/art_derive.py <spec-id>|--all
```

Status discipline: each adapted script must carry a header comment noting the
precursor file it was adapted from. Validation must pass `--all` before promotion.

## Asset lifecycle (shotkit-derived, unchanged in spirit)

```
spec (docs/design/rabbit-game/art/specs/<id>.yaml)
  -> art/production/<id>/generations/round-NNN/    (immutable)
  -> art/production/<id>/critiques/round-NNN.critique.json   (pixel-verified; agent must actually read image pixels)
  -> art/production/<id>/accepted/                  (acceptance.json + promotion.json)
  -> promoted -> assets/                            (browser-consumable; spritesheet + frame manifest per Q-012)
  -> optional -> art/derivations/<id>.json          (derivation records)
```
