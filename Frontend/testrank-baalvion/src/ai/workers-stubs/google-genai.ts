// Vite-alias replacement for '@genkit-ai/google-genai' in the Cloudflare Workers build only
// (see genkit.ts in this folder for why, and vite.config.ts for the alias).
export function googleAI(_config?: unknown) {
  return {};
}
