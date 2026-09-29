import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

// genkit's otel dependency chain doesn't bundle for workerd (see src/ai/workers-stubs/genkit.ts);
// the app's own AI flows already fall back to demo content when genkit throws, so these stubs
// just make that the Workers-build behavior instead of a GEMINI_API_KEY-quota failure.
const workersStubs = fileURLToPath(new URL("./src/ai/workers-stubs", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      genkit: `${workersStubs}/genkit.ts`,
      "@genkit-ai/google-genai": `${workersStubs}/google-genai.ts`,
    },
  },
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
