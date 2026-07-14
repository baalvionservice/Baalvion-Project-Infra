import { buildMetadata } from '@/lib/seo';
import CagrClient from './CagrClient';

export const metadata = buildMetadata({
  canonical: '/financial-tools/cagr',
  title: 'CAGR Calculator',
  description: 'Calculate the Compound Annual Growth Rate (CAGR) between a starting and ending investment value.',
  keywords: ['CAGR Calculator', 'Compound Annual Growth Rate', 'Stock Returns', 'Investment Growth'],
});

export default function CagrPage() {
  return <CagrClient />;
}
