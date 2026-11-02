import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": [
        "error",
        { selector: "ExportDefaultDeclaration", message: "Use named exports." },
      ],
    },
  },
  {
    // Tool config files require default exports.
    files: ["*.config.{js,ts}", "**/*.config.{js,ts}"],
    rules: { "no-restricted-syntax": "off" },
  },
);
