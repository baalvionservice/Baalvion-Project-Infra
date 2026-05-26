import { buildMetadata } from '@/lib/seo';
import PortfolioClient from './PortfolioClient';

/**
 * SEO-optimized route for the Portfolio ROI Architect.
 */
export const metadata = buildMetadata({
  title: 'Portfolio ROI Architect',
  description: 'Architect a diversified investment matrix with our Portfolio ROI Calculator. Define capital allocation across multiple nodes and analyze weighted return projections.',
  keywords: ['Portfolio Calculator', 'Asset Allocation', 'Diversification Tool', 'Weighted ROI', 'Multi-Asset Modeling'],
});

export default function PortfolioCalculatorPage() {
  return <PortfolioClient />;
}
