import { buildMetadata } from '@/lib/seo';
import CompoundInterestClient from './CompoundInterestClient';

/**
 * SEO-optimized route for the Compound Interest Calculator.
 */
export const metadata = buildMetadata({
  title: 'Compound Interest Calculator',
  description: 'Maximize your wealth with our precision Compound Interest Calculator. Visualize exponential growth and the long-term impact of compounding frequencies on your savings.',
  keywords: ['Compound Interest', 'Wealth Building', 'Exponential Growth', 'Savings Calculator', 'Future Value'],
});

export default function CompoundInterestPage() {
  return <CompoundInterestClient />;
}
