import { buildMetadata } from '@/lib/seo';
import ProfitLossClient from './ProfitLossClient';

export const metadata = buildMetadata({
  canonical: '/financial-tools/profit-loss',
  title: 'Profit/Loss Calculator',
  description: 'Calculate realized profit or loss on a stock trade, including fees.',
  keywords: ['Profit Loss Calculator', 'Stock Trade Calculator', 'Realized Gains'],
});

export default function ProfitLossPage() {
  return <ProfitLossClient />;
}
