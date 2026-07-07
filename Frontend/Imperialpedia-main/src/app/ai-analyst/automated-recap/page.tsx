import { buildMetadata } from '@/lib/seo';
import AutomatedRecapClient from './AutomatedRecapClient';

export const metadata = buildMetadata({
  title: 'Automated Market Recap Generator | AI Analyst',
  description: 'Generate an AI-synthesized recap of market-moving events for any asset, condensed into a fast-read summary.',
  canonical: '/ai-analyst/automated-recap',
});

export default function AutomatedRecapPage() {
  return <AutomatedRecapClient />;
}
