import { buildMetadata } from '@/lib/seo';
import NewsSummaryClient from './NewsSummaryClient';

export const metadata = buildMetadata({
  title: 'AI News Summary Generator | AI Analyst',
  description: 'Generate an AI-synthesized summary of breaking financial news — condensed into the key facts and market impact.',
  canonical: '/ai-analyst/news-summary',
});

export default function NewsSummaryPage() {
  return <NewsSummaryClient />;
}
