import { buildMetadata } from '@/lib/seo';
import BearCaseClient from './BearCaseClient';

export const metadata = buildMetadata({
  title: 'AI Bear Case Generator | AI Analyst',
  description: 'Generate a structured, AI-synthesized bear case for any asset — key downside risks, catalysts, and counter-arguments in one report.',
  canonical: '/ai-analyst/bear-case',
});

export default function BearCaseGeneratorPage() {
  return <BearCaseClient />;
}
