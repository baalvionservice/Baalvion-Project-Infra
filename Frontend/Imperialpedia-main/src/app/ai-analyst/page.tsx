import { buildMetadata } from '@/lib/seo';
import AIAnalystHubClient from './AIAnalystHubClient';

export const metadata = buildMetadata({
  title: 'AI Financial Analyst Hub | Automated Market Intelligence',
  description:
    'Generate AI-powered daily briefings, earnings summaries, macro analysis, risk detection, and sector overviews on demand across the Imperialpedia intelligence network.',
  canonical: '/ai-analyst',
});

export default function AIAnalystHubPage() {
  return <AIAnalystHubClient />;
}
