import { buildMetadata } from '@/lib/seo';
import InvestmentClient from './InvestmentClient';

/**
 * SEO-optimized route for the Investment ROI Calculator.
 */
export const metadata = buildMetadata({
  title: 'Investment ROI Calculator',
  description: 'Project your long-term wealth accumulation with our Investment ROI Engine. Model monthly contributions and expected market returns to visualize your portfolio trajectory.',
  keywords: ['Investment Calculator', 'ROI Engine', 'Wealth Accumulation', 'Stock Market Returns', 'Portfolio Growth'],
});

export default function InvestmentReturnPage() {
  return <InvestmentClient />;
}
