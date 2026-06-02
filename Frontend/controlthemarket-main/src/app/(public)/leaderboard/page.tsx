import type { Metadata } from 'next';
import { getLeaderboard } from '@/lib/ranking-engine';

export const metadata: Metadata = {
  title: 'Skill Leaderboard',
  description:
    'See the top-ranked candidates on ControlTheMarket ranked by verified real-world skill performance. Discover who is leading the market.',
  alternates: {
    canonical: 'https://controlthemarket.com/leaderboard',
  },
  openGraph: {
    url: 'https://controlthemarket.com/leaderboard',
    title: 'Skill Leaderboard | ControlTheMarket',
    description:
      'See the top-ranked candidates ranked by verified real-world skill performance.',
  },
};
import type { User, RoleCategory } from '@/lib/types';
import { LeaderboardClientPage } from './leaderboard-client-page';

// Reusing a similar ranking type from the admin dashboard
export type PublicCandidateRanking = {
  rank: number;
  candidate: User;
  aggregatedScore: number;
  primaryRole?: RoleCategory;
  tasksCompleted: number;
};

export default async function PublicLeaderboardPage() {
    const leaderboardData = await getLeaderboard();
    
    // Adapt the full leaderboard data to the public format
    const publicLeaderboardData: PublicCandidateRanking[] = leaderboardData.map(item => ({
        rank: item.rank,
        candidate: item.candidate,
        aggregatedScore: item.aggregatedScore,
        primaryRole: item.primaryRole,
        tasksCompleted: item.tasksCompleted,
    }));

    return <LeaderboardClientPage initialData={publicLeaderboardData} />;
}
