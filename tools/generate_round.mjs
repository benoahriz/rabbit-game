#!/usr/bin/env node
// tools/generate_round.mjs — rabbit-game art round generator (ComfyUI local API; zero deps).
// Adapted from precursor scripts/art_generate.py (space-adventure-prototype) for this repo's tooling layout.
// Provenance per docs/design/rabbit-game/art/adrs/ADR-0002: rounds are immutable;
// writes request.json, workflow.json, generation.json (hashes), and output PNGs.
//
// Usage: node tools/generate_round.mjs <round-spec.json> [target_dir]
// Round spec: { id, base: {model, steps, cfg, sampler, scheduler, size, negative}, options: [{id, prompt, seed}] }
// Writes into target_dir (default art/calibration/<id>/generations/round-001 of the repo root).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COMFY = process.env.COMFYUI_URL ?? "http://127.0.0.1:8188";
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [, , specPath, targetArg] = process.argv;
if (!specPath) { console.error("usage: node tools/generate_round.mjs <round-spec.json> [target_dir]"); process.exit(2); }

const spec = JSON.parse(await readFile(specPath, "utf8"));
const targetDir = targetArg
  ? resolve(process.cwd(), targetArg)
  : join(REPO, "art", "calibration", spec.id, "generations", "round-001");
await mkdir(targetDir, { recursive: true });

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const post = async (url, body) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${url} -> ${r.status} ${await r.text()}`);
  return r.json();
};
const jget = async (url) => (await fetch(url)).json();

function graph(base, option) {
  const { model, steps, cfg, sampler, scheduler, size, negative } = base;
  return {
    "4": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: model } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: option.prompt, clip: ["4", 1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: negative, clip: ["4", 1] } },
    "5": { class_type: "EmptyLatentImage", inputs: { width: size.width, height: size.height, batch_size: 1 } },
    "3": { class_type: "KSampler", inputs: { seed: option.seed, steps, cfg, sampler_name: sampler, scheduler, denoise: 1, model: ["4", 0], positive: ["6", 0], negative: ["7", 0], latent_image: ["5", 0] } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["4", 2] } },
    "9": { class_type: "SaveImage", inputs: { filename_prefix: `rg/${spec.id}/${option.id}`, images: ["8", 0] } },
  };
}

const pollHistory = async (promptId, tries = 240) => {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const h = await jget(`${COMFY}/history/${promptId}`);
    if (h[promptId]) return h[promptId];
  }
  throw new Error(`timeout waiting for ${promptId}`);
};

const records = [];
for (const option of spec.options) {
  const wf = graph(spec.base, option);
  const { prompt_id } = await post(`${COMFY}/prompt`, { prompt: wf });
  const hist = await pollHistory(prompt_id);
  const out = hist.outputs["9"].images[0];
  const bytes = Buffer.from(await (await fetch(`${COMFY}/view?filename=${encodeURIComponent(out.filename)}&subfolder=${encodeURIComponent(out.subfolder)}&type=${out.type}`)).arrayBuffer());
  const pngPath = join(targetDir, `${option.id}.png`);
  await writeFile(pngPath, bytes);
  records.push({
    option: option.id,
    prompt: option.prompt,
    seed: option.seed,
    comfy_prompt_id: prompt_id,
    model: spec.base.model,
    steps: spec.base.steps, cfg: spec.base.cfg,
    sampler: spec.base.sampler, scheduler: spec.base.scheduler,
    size: spec.base.size, execution: "local",
    file: `${option.id}.png`,
    sha256: sha256(bytes),
  });
  console.log(`ok ${option.id} -> ${pngPath}`);
}

await writeFile(join(targetDir, "request.json"), JSON.stringify({ spec_id: spec.id, created_at: new Date().toISOString(), options: spec.options.map((o) => o.id) }, null, 2));
await writeFile(join(targetDir, "workflow.json"), JSON.stringify(graph(spec.base, spec.options[0]), null, 2));
await writeFile(join(targetDir, "generation.json"), JSON.stringify({ spec_id: spec.id, created_at: new Date().toISOString(), engine: "ComfyUI 0.34.0 (local, MPS)", execution_note: "local checkpoint; deterministic only where the backend exposes seeds", records }, null, 2));
console.log(`round complete: ${targetDir}`);
