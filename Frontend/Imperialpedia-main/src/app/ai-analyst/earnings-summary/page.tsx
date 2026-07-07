import { buildMetadata } from '@/lib/seo';
import EarningsSummaryClient from './EarningsSummaryClient';

export const metadata = buildMetadata({
  title: 'AI Earnings Summary Generator | AI Analyst',
  description: 'Generate an AI-synthesized summary of a company earnings report — key beats, misses, and guidance in plain language.',
  canonical: '/ai-analyst/earnings-summary',
});

export default function EarningsSummaryPage() {
  return <EarningsSummaryClient />;
}
