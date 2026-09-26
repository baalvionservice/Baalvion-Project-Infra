import { buildMetadata } from '@/lib/seo';
import CompoundInterestClient from './CompoundInterestClient';
import { ToolExplainer, resolveToolExplainerContent } from '@/components/financial-tools/ToolExplainer';
import { compoundInterestExplainer } from '@/components/financial-tools/tool-explainer-content';

/**
 * SEO-optimized route for the Compound Interest Calculator.
 */
export const metadata = buildMetadata({
  canonical: '/financial-tools/compound-interest',
  title: 'Compound Interest Calculator',
  description: 'Maximize your wealth with our precision Compound Interest Calculator. Visualize exponential growth and the long-term impact of compounding frequencies on your savings.',
  keywords: ['Compound Interest', 'Wealth Building', 'Exponential Growth', 'Savings Calculator', 'Future Value'],
});

export default async function CompoundInterestPage() {
  const content = await resolveToolExplainerContent('compound-interest', compoundInterestExplainer);
  return (
    <>
      <CompoundInterestClient />
      <ToolExplainer content={content} />
    </>
  );
}
