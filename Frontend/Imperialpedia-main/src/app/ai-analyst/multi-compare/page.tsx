import { buildMetadata } from '@/lib/seo';
import MultiAssetComparisonClient from './MultiAssetComparisonClient';

export const metadata = buildMetadata({
  title: 'AI Multi-Asset Comparison Tool | AI Analyst',
  description: 'Compare multiple assets side-by-side with an AI-generated breakdown of fundamentals, risk, and relative performance.',
  canonical: '/ai-analyst/multi-compare',
});

export default function MultiAssetComparisonPage() {
  return <MultiAssetComparisonClient />;
}
