import { buildMetadata } from '@/lib/seo';
import InflationClient from './InflationClient';

/**
 * SEO-optimized route for the Inflation Impact Calculator.
 */
export const metadata = buildMetadata({
  title: 'Inflation Impact Calculator',
  description: 'Understand the eroding effects of inflation on your purchasing power. Calculate the future equivalent value of your current capital using global economic benchmarks.',
  keywords: ['Inflation Calculator', 'Purchasing Power', 'Economic Analysis', 'Currency Erosion', 'Future Value'],
});

export default function InflationCalculatorPage() {
  return <InflationClient />;
}
