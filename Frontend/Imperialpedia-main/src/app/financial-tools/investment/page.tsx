import { buildMetadata } from '@/lib/seo';
import InvestmentClient from './InvestmentClient';
import { ToolExplainer, resolveToolExplainerContent } from '@/components/financial-tools/ToolExplainer';
import { investmentExplainer } from '@/components/financial-tools/tool-explainer-content';

/**
 * SEO-optimized route for the Investment ROI Calculator.
 */
export const metadata = buildMetadata({
  canonical: '/financial-tools/investment',
  title: 'Investment ROI Calculator',
  description: 'Project your long-term wealth accumulation with our Investment ROI Engine. Model monthly contributions and expected market returns to visualize your portfolio trajectory.',
  keywords: ['Investment Calculator', 'ROI Engine', 'Wealth Accumulation', 'Stock Market Returns', 'Portfolio Growth'],
});

export default async function InvestmentReturnPage() {
  const content = await resolveToolExplainerContent('investment', investmentExplainer);
  return (
    <>
      <InvestmentClient />
      <ToolExplainer content={content} />
    </>
  );
}
