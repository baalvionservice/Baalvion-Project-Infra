import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Creator Leaderboard | Baalvion Connect',
  description: 'Discover the top-ranked creators on Baalvion Connect. Live rankings by AI performance score, engagement rate, and campaign earnings across YouTube, Instagram, and TikTok.',
  path: '/leaderboard',
});

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
