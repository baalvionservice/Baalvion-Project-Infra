
import { getLeaderboard } from '@/lib/ranking-engine';
import type { User, RoleCategory } from '@/lib/types';
import { CandidateRankingClientPage } from './ranking-client-page';

// Reaches ctm-service transitively (ranking-engine -> @/lib/api), which throws CtmDataError
// when the service is unreachable. Prerendering this at build time therefore fails.
export const dynamic = 'force-dynamic';

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
