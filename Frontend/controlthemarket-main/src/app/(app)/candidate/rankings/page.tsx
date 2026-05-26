
import { getLeaderboard } from '@/lib/ranking-engine';
import type { User, RoleCategory } from '@/lib/types';
import { CandidateRankingClientPage } from './ranking-client-page';

export type CandidateRanking = {
  rank: number;
  candidate: User;
  aggregatedScore: number;
  primaryRole?: RoleCategory;
  tasksCompleted: number;
};

export default async function RankingsPage() {
    const leaderboardData = await getLeaderboard();
    
    // Adapt the full leaderboard data to the format expected by the client page
    const rankingData: CandidateRanking[] = leaderboardData.map(item => ({
        rank: item.rank,
        candidate: item.candidate,
        aggregatedScore: item.aggregatedScore,
        primaryRole: item.primaryRole,
        tasksCompleted: item.tasksCompleted,
    }));

    return <CandidateRankingClientPage initialData={rankingData} />;
}
