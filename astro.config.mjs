// @ts-check
import { defineConfig } from "astro/config";

// The in-package src/pages are an unpublished dev site. Its build output must
// NOT be dist/ — that's the package's compiled core/client runtime (tsc).
export default defineConfig({
  outDir: "./dev-dist",
});
