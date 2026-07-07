import { buildMetadata } from '@/lib/seo';
import SocialSentimentClient from './SocialSentimentClient';

export const metadata = buildMetadata({
  title: 'AI Social Sentiment Tracker | AI Analyst',
  description: 'Track AI-synthesized social and media sentiment for any asset — perception shifts, sentiment scores, and narrative trends.',
  canonical: '/ai-analyst/social-sentiment',
});

export default function SocialSentimentPage() {
  return <SocialSentimentClient />;
}
