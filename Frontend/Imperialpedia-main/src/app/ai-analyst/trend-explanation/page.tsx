import { buildMetadata } from '@/lib/seo';
import TrendExplanationClient from './TrendExplanationClient';

export const metadata = buildMetadata({
  title: 'AI Trend Explanation Tool | AI Analyst',
  description: 'Get an AI-generated explanation of why an asset is trending — the news, data, and flows behind the move.',
  canonical: '/ai-analyst/trend-explanation',
});

export default function TrendExplanationPage() {
  return <TrendExplanationClient />;
}
