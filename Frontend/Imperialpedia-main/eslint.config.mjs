import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
        JSX: "readonly",
        console: "readonly",
        window: "readonly",
        document: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        Response: "readonly",
        Request: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "warn",
      "no-undef": "off", // TypeScript handles this
    },
  },
  {
    // De-mock migration guard: pages (src/app) must consume the real data layer
    // (@/services/data/*), never mock-api directly. 'warn' tracks the remaining mock surface
    // during migration — flip to 'error' once all admin pages are converted off mock.
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["warn", {
        patterns: [{
          group: ["@/services/mock-api", "@/services/mock-api/*", "**/services/mock-api/*"],
          message: "Pages must use the real data layer (@/services/data/*), not mock-api — convert this page to the live service.",
        }],
      }],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "dist/**",
      "coverage/**",
    ],
  },
];
