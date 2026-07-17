import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  eslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ["dist/", "node_modules/"],
  },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "off", // handled by tsc noUnusedLocals
      "no-redeclare": "off", // TS enums trigger false positives
    },
  },
];
