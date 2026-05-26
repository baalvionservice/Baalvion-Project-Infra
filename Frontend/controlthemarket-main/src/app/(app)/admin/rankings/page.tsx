
import { getEvaluationSchemas } from '@/lib/api';
import { RankingList } from './ranking-list';
import type { User, EvaluationSchema, RoleCategory } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getLeaderboard } from '@/lib/ranking-engine';


// The local CandidateRanking type is now aligned with the LeaderboardRanking from the engine.
export type CandidateRanking = {
  candidate: User;
  aggregatedScore: number;
  evaluationCount: number;
  criteriaScores: Record<string, number>;
  percentileRank: number;
  primaryRole?: RoleCategory;
  tasksCompleted: number;
  rank: number;
};


export default async function AdminRankingsPage() {
  const [leaderboardData, allSchemas] = await Promise.all([
    getLeaderboard(),
    getEvaluationSchemas(),
  ]);
  
  // The engine now returns a more complete object, so we map it.
  const rankingData: CandidateRanking[] = leaderboardData.map(item => ({
      ...item
  }));

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Candidate Rankings
          </h2>
          <p className="text-muted-foreground">
            Global leaderboard based on aggregated evaluation scores and percentile ranks.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Global Leaderboard</CardTitle>
          <CardDescription>
            Candidates are ranked based on a weighted average of their performance across all tasks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankingList data={rankingData} schemas={allSchemas} />
        </CardContent>
      </Card>
    </div>
  );
}
