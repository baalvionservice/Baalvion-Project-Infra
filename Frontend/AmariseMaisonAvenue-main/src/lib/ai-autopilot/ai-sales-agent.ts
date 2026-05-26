/**
 * @fileOverview AI Sales Agent Module
 * Handles intent detection and automated curatorial replies.
 */

import { PrivateInquiry, SalesScript } from '../types';

export type AISalesIntent = 'Investment' | 'Personal' | 'Collector' | 'Exploratory';

export function detectIntent(message: string): AISalesIntent {
  const text = message.toLowerCase();
  if (text.includes('investment') || text.includes('roi') || text.includes('value') || text.includes('market')) {
    return 'Investment';
  }
  if (text.includes('gift') || text.includes('personal') || text.includes('myself') || text.includes('wear')) {
    return 'Personal';
  }
  if (text.includes('archive') || text.includes('provenance') || text.includes('history') || text.includes('artifact')) {
    return 'Collector';
  }
  return 'Exploratory';
}

export function generateAIReply(inquiry: PrivateInquiry, scripts: SalesScript[]): string {
  const intent = detectIntent(inquiry.message || '');
  let script: SalesScript | undefined;

  // Logic to select the best script based on intent and stage
  if (inquiry.status === 'new') {
    script = scripts.find(s => s.stage === 'new');
  } else if (intent === 'Investment') {
    script = scripts.find(s => s.id === 'script-investor');
  } else if (intent === 'Personal') {
    script = scripts.find(s => s.id === 'script-personal');
  } else if (intent === 'Collector') {
    script = scripts.find(s => s.id === 'script-init');
  }

  return script?.template || "The curatorial desk is reviewing your unique requirements. We will provide a bespoke perspective shortly.";
}
