/**
 * @fileOverview AssistantService
 * Orchestrates the AI guidance loop for elite members.
 * Bridges the legacy assistant logic with the new context-aware Co-Pilot.
 */

import { chatWithAI } from "./ai/aiService";

/**
 * Synchronizes with the intelligence engine to provide a guided experience.
 */
export const askAssistant = async (message: string, context?: any) => {
  return await chatWithAI(message, context);
};
