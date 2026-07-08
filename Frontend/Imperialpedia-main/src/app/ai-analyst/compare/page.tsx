import { buildMetadata } from '@/lib/seo';
import AssetComparisonClient from './AssetComparisonClient';

export const metadata = buildMetadata({
  title: 'AI Asset Comparison Tool | AI Analyst',
  description: 'Compare two assets head-to-head with an AI-generated breakdown of fundamentals, risk, and relative performance.',
  canonical: '/ai-analyst/compare',
});

export default function AssetComparisonPage() {
  return <AssetComparisonClient />;
}
