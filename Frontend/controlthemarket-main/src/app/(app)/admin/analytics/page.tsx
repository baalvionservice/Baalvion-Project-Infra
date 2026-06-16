
import { getCompanies, getSubmissions, getTasks, getUsers, getAllEvaluations, getEvaluationSchemas } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Users, Building, Briefcase, FileText, Bot, AlertTriangle, FlaskConical, Clock } from "lucide-react";
import { 
    GlobalStatusDistributionChart, 
    GlobalTasksByCompanyChart, 
    GlobalLeaderboard,
    GlobalSubmissionTrendChart,
    SkillLevelDistributionChart,
    PercentileDistributionChart,
    AverageScoreTrendChart,
    ValidationStatusChart,
    TestCaseStatusChart,
    PlagiarismRiskChart,
} from "./charts";
import type { Evaluation, EvaluationSchema, Submission } from "@/lib/types";

// Note: This logic is duplicated from rankings page for simplicity in this mock environment.
// In a real app, this would be a shared utility.
const calculateAggregatedScore = (
  evaluations: Evaluation[],
  schemas: EvaluationSchema[]
): { score: number; criteria: Record<string, number> } => {
  if (evaluations.length === 0) return { score: 0, criteria: {} };

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const allCriteriaScores: Record<string, { total: number; count: number }> = {};

  evaluations.forEach((ev) => {
    const schema = schemas[0];
    let evaluationWeightedScore = 0;
    let evaluationTotalWeight = 0;

    if (ev.criteriaScores && schema) {
      for (const criterion of schema.criteria) {
        const score = ev.criteriaScores[criterion.name];
        const weight = criterion.weight || 1;
        if (score !== undefined) {
          evaluationWeightedScore += (score / criterion.maxPoints) * weight;
          evaluationTotalWeight += weight;

          if (!allCriteriaScores[criterion.name]) {
            allCriteriaScores[criterion.name] = { total: 0, count: 0 };
          }
          allCriteriaScores[criterion.name].total += score;
          allCriteriaScores[criterion.name].count += 1;
        }
      }
    }
    
    if (evaluationTotalWeight === 0) {
        totalWeightedScore += ev.score;
        totalWeight += 100;
    } else {
        totalWeightedScore += (evaluationWeightedScore / evaluationTotalWeight) * 100;
        totalWeight += 100;
    }
  });

  const finalScore = Math.round(totalWeightedScore / evaluations.length);
  const finalCriteriaScores: Record<string, number> = {};
  for(const key in allCriteriaScores) {
      finalCriteriaScores[key] = Math.round(allCriteriaScores[key].total / allCriteriaScores[key].count);
  }

  return { score: finalScore, criteria: finalCriteriaScores };
};


export default async function AdminAnalyticsPage() {
    const [users, companies, tasks, submissions, allEvaluations, schemas] = await Promise.all([
        getUsers(),
        getCompanies(),
        getTasks(),
        getSubmissions(),
        getAllEvaluations(),
        getEvaluationSchemas(),
    ]);

    const candidates = users.filter((u) => u.role === 'candidate');

    const unsortedRankingData = candidates.map((candidate) => {
        const candidateSubmissions = submissions.filter((sub) => sub.userId === candidate.id);
        const candidateSubmissionIds = new Set(candidateSubmissions.map((s) => s.id));
        const candidateEvaluations = allEvaluations.filter((ev) => candidateSubmissionIds.has(ev.submissionId));
        if (candidateEvaluations.length === 0) return null;
        const { score } = calculateAggregatedScore(candidateEvaluations, schemas);
        return { aggregatedScore: score, };
    }).filter((r): r is { aggregatedScore: number } => r !== null);

    const sortedData = unsortedRankingData.sort((a, b) => b.aggregatedScore - a.aggregatedScore);
    const totalRankedCandidates = sortedData.length;
    const rankingDataWithPercentile = sortedData.map((candidate, index) => ({
        ...candidate,
        percentileRank: totalRankedCandidates > 0 ? Math.ceil(((index + 1) / totalRankedCandidates) * 100) : 0,
    }));

    const percentileTiers = { 'Top 10%': 0, 'Top 25%': 0, 'Top 50%': 0, 'Bottom 50%': 0 };
    rankingDataWithPercentile.forEach(c => {
        if (c.percentileRank <= 10) percentileTiers['Top 10%']++;
        else if (c.percentileRank <= 25) percentileTiers['Top 25%']++;
        else if (c.percentileRank <= 50) percentileTiers['Top 50%']++;
        else percentileTiers['Bottom 50%']++;
    });
    const percentileData = Object.entries(percentileTiers).map(([tier, count]) => ({ tier, count }));

    const leaderboardData = allEvaluations
        .map(ev => {
            const submission = submissions.find(s => s.id === ev.submissionId);
            const candidate = users.find(u => u.id === submission?.userId);
            return {
                candidateId: candidate?.id || ev.id,
                candidateName: candidate?.name || 'Unknown',
                score: ev.score,
                avatarUrl: candidate?.profile?.avatarUrl,
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
        
    // Execution Analytics Metrics
    const totalTimedSubmissions = submissions.filter(s => s.timeSpentMinutes !== undefined).length;
    const totalTimeSpent = submissions.reduce((acc, sub) => acc + (sub.timeSpentMinutes || 0), 0);
    const avgTimeSpent = totalTimedSubmissions > 0 ? Math.round(totalTimeSpent / totalTimedSubmissions) : 0;
    
    const submissionsWithTests = submissions.filter(s => s.testCaseStatus !== 'Pending' && s.testCaseStatus !== undefined);
    const testPasses = submissionsWithTests.filter(s => s.testCaseStatus === 'Passed').length;
    const testPassRate = submissionsWithTests.length > 0 ? Math.round((testPasses / submissionsWithTests.length) * 100) : 0;

    const validationIssues = submissions.filter(s => s.validationStatus === 'Invalid' || s.validationStatus === 'Warning').length;
    const plagiarismAlerts = submissions.filter(s => s.plagiarismRisk === 'High' || s.plagiarismRisk === 'Medium').length;


    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Platform Analytics
                    </h2>
                    <p className="text-muted-foreground">
                        An overview of all activity across the ControlTheMarket platform.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Total Companies
                    </CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{companies.length}</div>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{tasks.length}</div>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                    Total Submissions
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold">{submissions.length}</div>
                </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Execution Analytics</CardTitle>
                    <CardDescription>Metrics related to automated session execution and validation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgTimeSpent} min</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Test Pass Rate</CardTitle>
                            <FlaskConical className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{testPassRate}%</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Validation Issues</CardTitle>
                            <Bot className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{validationIssues}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Plagiarism Alerts</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{plagiarismAlerts}</div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                <ValidationStatusChart submissions={submissions} />
                <TestCaseStatusChart submissions={submissions} />
                <PlagiarismRiskChart submissions={submissions} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 space-y-6">
                    <AverageScoreTrendChart evaluations={allEvaluations} />
                    <GlobalSubmissionTrendChart submissions={submissions} />
                    <GlobalTasksByCompanyChart tasks={tasks} companies={companies} />
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <GlobalLeaderboard data={leaderboardData} />
                    <PercentileDistributionChart data={percentileData} />
                    <SkillLevelDistributionChart users={users.filter(u => u.role === 'candidate')} />
                </div>
            </div>
        </div>
    );
}
