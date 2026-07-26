import { buildMetadata } from '@/lib/seo';
import PositionSizeClient from './PositionSizeClient';
import { ToolExplainer, resolveToolExplainerContent } from '@/components/financial-tools/ToolExplainer';
import { positionSizeExplainer } from '@/components/financial-tools/tool-explainer-content';

export const metadata = buildMetadata({
  canonical: '/financial-tools/position-size',
  title: 'Position Size Calculator',
  description: 'Size a stock trade based on your account risk budget, entry price, and stop-loss level.',
  keywords: ['Position Size Calculator', 'Risk Management', 'Stop Loss', 'Trading Risk'],
});

export default async function PositionSizePage() {
  const content = await resolveToolExplainerContent('position-size', positionSizeExplainer);
  return (
    <>
      <PositionSizeClient />
      <ToolExplainer content={content} />
    </>
  );
}
