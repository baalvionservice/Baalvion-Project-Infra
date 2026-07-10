import { buildMetadata } from '@/lib/seo';
import DailyBriefingClient from './DailyBriefingClient';

export const metadata = buildMetadata({
  title: 'AI Daily Market Briefing | AI Analyst',
  description: 'Get a fresh, AI-generated daily briefing on market-moving news, macro data, and sentiment shifts.',
  canonical: '/ai-analyst/daily-briefing',
});

export default function DailyBriefingPage() {
  return <DailyBriefingClient />;
}
