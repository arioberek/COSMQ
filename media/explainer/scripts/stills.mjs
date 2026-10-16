// Renders proof stills for quick review: bundles once, then renders each
// "<CompositionId>:<frame>" passed on the command line into renders/stills/.
//   node scripts/stills.mjs Explainer:90 Product:145 Poster:0

import { mkdirSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Usage: node scripts/stills.mjs <Composition>:<frame> ...");
  process.exit(1);
}

const outDir = path.resolve("renders/stills");
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const scale = Number(process.env.STILL_SCALE ?? "1");

for (const target of targets) {
  const [id, frameStr] = target.split(":");
  const frame = Number(frameStr ?? 0);
  const composition = await selectComposition({ serveUrl, id });
  const output = path.join(outDir, `${id}-${String(frame).padStart(4, "0")}.jpeg`);
  await renderStill({
    composition,
    serveUrl,
    output,
    frame,
    imageFormat: "jpeg",
    jpegQuality: 88,
    scale,
  });
  console.log(output);
}
