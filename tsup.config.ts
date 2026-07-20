import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    client: "src/client/index.ts",
    core: "src/core/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: true,
  splitting: false,
  external: ["@fastpix/resumable-uploads"],
});
