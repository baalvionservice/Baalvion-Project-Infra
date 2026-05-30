/**
 * Shared genkit-flow guard. Wraps a genkit prompt call so the AI-analyst suite NEVER crashes
 * when the model is unavailable (no GEMINI_API_KEY, quota, transient error, or invalid output).
 * Without a key → returns the provided templated fallback (so every page renders real-now).
 * With a key set → returns the real Gemini output.
 *
 * Enable real AI: set GEMINI_API_KEY (or GOOGLE_GENAI_API_KEY) in the frontend env — the
 * `googleAI()` genkit plugin (see ./genkit.ts) picks it up automatically.
 */
export async function runFlow<T>(
  call: () => Promise<{ output?: T | null }>,
  fallback: T,
): Promise<T> {
  try {
    const { output } = await call();
    if (output) return output;
  } catch (err) {
    console.warn('[AI flow] genkit unavailable, using fallback:', (err as Error)?.message);
  }
  return fallback;
}

/** True when a generative-AI key is configured (for status/UX hints). */
export const aiConfigured = (): boolean =>
  !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
