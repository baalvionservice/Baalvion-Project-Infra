import { buildMetadata } from '@/lib/seo';
import BullCaseClient from './BullCaseClient';

export const metadata = buildMetadata({
  title: 'AI Bull Case Generator | AI Analyst',
  description: 'Generate a structured, AI-synthesized bull case for any asset — growth catalysts, upside drivers, and supporting data in one report.',
  canonical: '/ai-analyst/bull-case',
});

export default function BullCaseGeneratorPage() {
  return <BullCaseClient />;
}
