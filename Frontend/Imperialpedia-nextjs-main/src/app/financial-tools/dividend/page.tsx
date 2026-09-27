import { buildMetadata } from '@/lib/seo';
import DividendClient from './DividendClient';
import { ToolExplainer, resolveToolExplainerContent } from '@/components/financial-tools/ToolExplainer';
import { dividendExplainer } from '@/components/financial-tools/tool-explainer-content';

export const metadata = buildMetadata({
  canonical: '/financial-tools/dividend',
  title: 'Dividend Calculator',
  description: 'Estimate the annual and monthly dividend income a stock position would generate.',
  keywords: ['Dividend Calculator', 'Dividend Yield', 'Passive Income', 'Dividend Stocks'],
});

export default async function DividendPage() {
  const content = await resolveToolExplainerContent('dividend', dividendExplainer);
  return (
    <>
      <DividendClient />
      <ToolExplainer content={content} />
    </>
  );
}
