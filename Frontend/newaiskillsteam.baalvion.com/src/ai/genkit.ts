// Hard server boundary: importing the Genkit + OpenTelemetry runtime from a client component now
// fails the build instead of silently shipping AI/telemetry code to the browser. AI logic is
// reachable only through `'use server'` flows and route handlers.
import 'server-only';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
