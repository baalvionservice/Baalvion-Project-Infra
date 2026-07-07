import { buildMetadata } from '@/lib/seo';
import WeeklyDigestClient from './WeeklyDigestClient';

export const metadata = buildMetadata({
  title: 'AI Weekly Digest Generator | AI Analyst',
  description: 'Generate an AI-synthesized weekly digest of the biggest market moves, macro releases, and sentiment shifts.',
  canonical: '/ai-analyst/weekly-digest',
});

export default function WeeklyDigestPage() {
  return <WeeklyDigestClient />;
}
