import { buildMetadata } from '@/lib/seo';
import LoanClient from './LoanClient';
import { ToolExplainer, resolveToolExplainerContent } from '@/components/financial-tools/ToolExplainer';
import { loanExplainer } from '@/components/financial-tools/tool-explainer-content';

/**
 * SEO-optimized route for the Loan Repayment Calculator.
 */
export const metadata = buildMetadata({
  canonical: '/financial-tools/loan',
  title: 'Loan Repayment Calculator',
  description: 'Master your debt with our Loan Repayment Engine. Calculate fixed monthly payments (EMI), total interest costs, and repayment timelines for mortgages and personal loans.',
  keywords: ['Loan Calculator', 'EMI Calculator', 'Mortgage Repayment', 'Debt Management', 'Interest Calculator'],
});

export default async function LoanCalculatorPage() {
  const content = await resolveToolExplainerContent('loan', loanExplainer);
  return (
    <>
      <LoanClient />
      <ToolExplainer content={content} />
    </>
  );
}
