// Vite-alias replacement for 'genkit' in the Cloudflare Workers build only (see vite.config.ts).
// genkit's real module graph pulls in @opentelemetry/sdk-logs against a newer
// @opentelemetry/core than it was built for (missing Resource/getEnv/etc. exports), which
// fails Rolldown's static bundle even though Next's webpack build never hit it (genkit stays a
// serverExternalPackage there, resolved at runtime instead of bundled). The two callers
// (ai-submission-feedback-flow, ai-task-description-assistant-flow) already catch a failing
// flow call and return demo content, so making the flow itself throw reaches that same,
// already-shipped fallback path.
export {z} from 'zod';

export function genkit(_config: unknown) {
  return {
    definePrompt: () => async () => {
      throw new Error('genkit is stubbed out of the Cloudflare Workers build');
    },
    defineFlow: (_config: unknown, fn: (input: unknown) => unknown) => fn,
  };
}
