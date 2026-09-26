import { buildMetadata } from '@/lib/seo';
import ProfitLossClient from './ProfitLossClient';
import { ToolExplainer, resolveToolExplainerContent } from '@/components/financial-tools/ToolExplainer';
import { profitLossExplainer } from '@/components/financial-tools/tool-explainer-content';

export const metadata = buildMetadata({
  canonical: '/financial-tools/profit-loss',
  title: 'Profit/Loss Calculator',
  description: 'Calculate realized profit or loss on a stock trade, including fees.',
  keywords: ['Profit Loss Calculator', 'Stock Trade Calculator', 'Realized Gains'],
});

export default async function ProfitLossPage() {
  const content = await resolveToolExplainerContent('profit-loss', profitLossExplainer);
  return (
    <>
      <ProfitLossClient />
      <ToolExplainer content={content} />
    </>
  );
}
