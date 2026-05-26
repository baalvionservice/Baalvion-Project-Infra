
import { getLeaderboard } from '@/lib/ranking-engine';
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
