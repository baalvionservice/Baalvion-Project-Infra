import { buildMetadata } from '@/lib/seo';
import RetirementClient from './RetirementClient';

/**
 * SEO-optimized route for the Nest Egg Architect (Retirement Calculator).
 */
export const metadata = buildMetadata({
  title: 'Retirement Planning Calculator',
  description: 'Architect your financial future with our Nest Egg Architect. Model your accumulation phase, current savings, and contribution velocity to project your retirement corpus.',
  keywords: ['Retirement Calculator', 'Nest Egg Architect', 'Financial Independence', 'Retirement Planning', 'Savings Projection'],
});

export default function RetirementCalculatorPage() {
  return <RetirementClient />;
}
