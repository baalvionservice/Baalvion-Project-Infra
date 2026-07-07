import { buildMetadata } from '@/lib/seo';
import MacroSummaryClient from './MacroSummaryClient';

export const metadata = buildMetadata({
  title: 'AI Macro Economic Summary | AI Analyst',
  description: 'Generate an AI-synthesized summary of current macroeconomic conditions — growth, inflation, employment, and policy stance.',
  canonical: '/ai-analyst/macro-summary',
});

export default function MacroSummaryPage() {
  return <MacroSummaryClient />;
}
