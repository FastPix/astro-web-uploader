// Concatenates src/styles/ (in cascade order) into src/client/generated/css.ts
// as an exported string. Never hand-edit it.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const stylesDir = join(pkgRoot, "src", "styles");
const outFile = join(pkgRoot, "src", "client", "generated", "css.ts");

// Cascade order: tokens (defaults + sentinel) first.
const SLICES = [
  "tokens.css",
  "host.css",
  "file-picker.css",
  "drop-zone.css",
  "track.css",
  "status.css",
  "buttons.css",
];

const parts = await Promise.all(SLICES.map((f) => readFile(join(stylesDir, f), "utf8")));
const css = parts.join("\n");

const banner =
  "// GENERATED FILE — do not edit. Built from src/styles/ by scripts/generate-css.mjs.\n";

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, `${banner}export const css: string = ${JSON.stringify(css)};\n`);
