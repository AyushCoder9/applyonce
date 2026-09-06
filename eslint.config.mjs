import parser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["**/.next/**", "**/dist/**", "**/node_modules/**", "**/test-results/**", "docs/source-inventory.json"] },
  {
    files: ["apps/**/*.{js,mjs,cjs,ts,tsx}", "packages/**/*.{js,mjs,cjs,ts,tsx}", "scripts/**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: { parser, parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "constructor-super": "error",
      "eqeqeq": ["error", "always", { null: "ignore" }],
      "no-constant-binary-expression": "error",
      "no-debugger": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-fallthrough": "error",
      "no-new-native-nonconstructor": "error",
      "no-self-assign": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-useless-catch": "error",
      "no-with": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
      "use-isnan": "error",
      "valid-typeof": "error"
    }
  }
];
