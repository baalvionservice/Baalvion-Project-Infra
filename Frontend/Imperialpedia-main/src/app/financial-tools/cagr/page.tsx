import { buildMetadata } from '@/lib/seo';
import CagrClient from './CagrClient';
import { ToolExplainer, resolveToolExplainerContent } from '@/components/financial-tools/ToolExplainer';
import { cagrExplainer } from '@/components/financial-tools/tool-explainer-content';

export const metadata = buildMetadata({
  canonical: '/financial-tools/cagr',
  title: 'CAGR Calculator',
  description: 'Calculate the Compound Annual Growth Rate (CAGR) between a starting and ending investment value.',
  keywords: ['CAGR Calculator', 'Compound Annual Growth Rate', 'Stock Returns', 'Investment Growth'],
});

export default async function CagrPage() {
  const content = await resolveToolExplainerContent('cagr', cagrExplainer);
  return (
    <>
      <CagrClient />
      <ToolExplainer content={content} />
    </>
  );
}
