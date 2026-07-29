import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "dev-dist/**", "coverage/**", "src/client/generated/**", ".astro/**"],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // groups value imports and `import type` imports into separate,
      // consistently-ordered blocks
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      // underscore-prefixed params are this codebase's "intentionally unused" convention
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // `interface X extends Y {}` is the standard pattern for global lib.dom
      // augmentation (see src/client/index.ts) — not a pointless empty type
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { allowInterfaces: "with-single-extends" },
      ],
    },
  },
  {
    // test doubles intentionally use `any` for engine event payloads
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
