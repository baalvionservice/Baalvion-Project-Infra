import { buildMetadata } from '@/lib/seo';
import LoanClient from './LoanClient';

/**
 * SEO-optimized route for the Loan Repayment Calculator.
 */
export const metadata = buildMetadata({
  title: 'Loan Repayment Calculator',
  description: 'Master your debt with our Loan Repayment Engine. Calculate fixed monthly payments (EMI), total interest costs, and repayment timelines for mortgages and personal loans.',
  keywords: ['Loan Calculator', 'EMI Calculator', 'Mortgage Repayment', 'Debt Management', 'Interest Calculator'],
});

export default function LoanCalculatorPage() {
  return <LoanClient />;
}
