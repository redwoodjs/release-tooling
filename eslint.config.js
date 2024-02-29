// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".yarn/*",
      ".pnp.loader.mjs",
    ],
  },
  {
    rules: {
      "no-constant-condition": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
