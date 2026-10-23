#!/usr/bin/env node
// tools/generate_round.mjs — rabbit-game art round generator; two lanes (zero deps):
//   local: ComfyUI HTTP API (SD-Turbo)          — default
//   cloud: OpenRouter image model (nano-banana) — PAID; requires explicit per-session user authorization
// Adapted from precursor scripts/art_generate.py (space-adventure-prototype) for this repo's tooling layout.
// Provenance per docs/design/rabbit-game/art/adrs/ADR-0002: rounds are immutable;
// writes request.json, workflow.json (local lane), generation.json (hashes), and output PNGs.
//
// Usage: node tools/generate_round.mjs <round-spec.json> [target_dir]
// Round spec: { id, base: {execution, model, steps, cfg, sampler, scheduler, size, negative}, options: [{id, prompt, seed}] }
// base.execution: "local" (ComfyUI) | "openrouter" (paid cloud).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COMFY = process.env.COMFYUI_URL ?? "http://127.0.0.1:8188";
const OPENROUTER_DEFAULT_MODEL = "google/gemini-2.5-flash-image"; // nano-banana (SHOTKIT lane)
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [, , specPath, targetArg] = process.argv;
if (!specPath) { console.error("usage: node tools/generate_round.mjs <round-spec.json> [target_dir]"); process.exit(2); }

const spec = JSON.parse(await readFile(specPath, "utf8"));
const execution = spec.base.execution ?? "local";
const targetDir = targetArg
  ? resolve(process.cwd(), targetArg)
  : join(REPO, "art", "calibration", spec.id, "generations", "round-001");
await mkdir(targetDir, { recursive: true });

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function openrouterKey() {
  // Read the OpenRouter key from the local opencode auth store. Never print it.
  const auth = JSON.parse(readFileSync(join(homedir(), ".local/share/opencode/auth.json"), "utf8"));
  const key = auth?.openrouter?.key;
  if (!key) throw new Error("no openrouter key in opencode auth store");
  return key;
}

/** Paid cloud generation via OpenRouter image model. Port of precursor scripts/art_generate.py::generate_openrouter. */
async function generateOpenRouter(prompt, model = OPENROUTER_DEFAULT_MODEL) {
  const body = JSON.stringify({
    model,
    modalities: ["image"],
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  });
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openrouterKey()}`, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`openrouter HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const result = await res.json();
  const msg = result.choices?.[0]?.message;
  const extractUrl = (part) => {
    if (typeof part === "string") return part.startsWith("data:") || part.startsWith("http") ? part : null;
    if (part && typeof part === "object") {
      const iu = part.image_url;
      if (typeof iu === "string" && (iu.startsWith("data:") || iu.startsWith("http"))) return iu;
      if (iu && typeof iu === "object" && iu.url) return iu.url;
    }
    return null;
  };
  let url = null;
  for (const part of msg?.images ?? []) { url = extractUrl(part); if (url) break; }
  if (!url) {
    const content = msg?.content;
    for (const part of (Array.isArray(content) ? content : [content])) { url = extractUrl(part); if (url) break; }
  }
  if (!url) throw new Error(`no image in response: ${JSON.stringify(msg)?.slice(0, 200)}`);
  let bytes;
  if (url.startsWith("data:")) bytes = Buffer.from(url.split(",", 2)[1], "base64");
  else bytes = Buffer.from(await (await fetch(url)).arrayBuffer());
  return { bytes, usage: result.usage ?? {}, model: result.model ?? model };
}

// --- lane 1: local ComfyUI graph ---
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

const post = async (url, body) => {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${url} -> ${r.status} ${await r.text()}`);
  return r.json();
};
const jget = async (url) => (await fetch(url)).json();

const pollHistory = async (promptId, tries = 240) => {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const h = await jget(`${COMFY}/history/${promptId}`);
    if (h[promptId]) return h[promptId];
  }
  throw new Error(`timeout waiting for ${promptId}`);
};

// --- main loop (lane-branched) ---
const records = [];
for (const option of spec.options) {
  let bytes, record;
  if (execution === "openrouter") {
    const model = spec.base.cloud_model ?? OPENROUTER_DEFAULT_MODEL;
    const { bytes: imgBytes, usage, model: servedModel } = await generateOpenRouter(option.prompt, model);
    bytes = imgBytes;
    record = {
      option: option.id,
      prompt: option.prompt,
      seed: "not-applicable (cloud lane)",
      model,
      served_model: servedModel,
      execution: "openrouter",
      execution_location: "openrouter.ai",
      paid: true,
      authorization: "explicit per-session user instruction (2026-10-23 question prompt)",
      openrouter_usage: usage,
      file: `${option.id}.png`,
      sha256: sha256(bytes),
    };
  } else {
    const wf = graph(spec.base, option);
    const { prompt_id } = await post(`${COMFY}/prompt`, { prompt: wf });
    const hist = await pollHistory(prompt_id);
    const out = hist.outputs["9"].images[0];
    bytes = Buffer.from(await (await fetch(`${COMFY}/view?filename=${encodeURIComponent(out.filename)}&subfolder=${encodeURIComponent(out.subfolder)}&type=${out.type}`)).arrayBuffer());
    record = {
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
    };
  }
  const pngPath = join(targetDir, `${option.id}.png`);
  await writeFile(pngPath, bytes);
  records.push(record);
  console.log(`ok ${option.id} -> ${pngPath}`);
}

await writeFile(join(targetDir, "request.json"), JSON.stringify({ spec_id: spec.id, spec_execution: execution, created_at: new Date().toISOString(), options: spec.options.map((o) => o.id) }, null, 2));
if (execution !== "openrouter") await writeFile(join(targetDir, "workflow.json"), JSON.stringify(graph(spec.base, spec.options[0]), null, 2));
const generationMeta = execution === "openrouter" ? {
  spec_id: spec.id,
  created_at: new Date().toISOString(),
  engine: `OpenRouter image model (${spec.base.model ?? OPENROUTER_DEFAULT_MODEL}) — nano-banana lane`,
  execution_note: "paid cloud lane; paid-per-image; no seed control; usage recorded per record",
  records,
} : {
  spec_id: spec.id,
  created_at: new Date().toISOString(),
  engine: "ComfyUI 0.34.0 (local, MPS)",
  execution_note: "local checkpoint; deterministic only where the backend exposes seeds",
  records,
};
await writeFile(join(targetDir, "generation.json"), JSON.stringify(generationMeta, null, 2));
console.log(`round complete: ${targetDir}`);
