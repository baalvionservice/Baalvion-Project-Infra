import { buildMetadata } from '@/lib/seo';
import DividendClient from './DividendClient';

export const metadata = buildMetadata({
  canonical: '/financial-tools/dividend',
  title: 'Dividend Calculator',
  description: 'Estimate the annual and monthly dividend income a stock position would generate.',
  keywords: ['Dividend Calculator', 'Dividend Yield', 'Passive Income', 'Dividend Stocks'],
});

export default function DividendPage() {
  return <DividendClient />;
}
