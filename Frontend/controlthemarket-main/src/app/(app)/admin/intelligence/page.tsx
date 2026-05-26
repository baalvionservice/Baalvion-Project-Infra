
import {
  getUsers,
  getSubmissions,
  getAllEvaluations,
  getCompanies,
} from '@/lib/api';
import type { User, Evaluation, Submission, Company, CandidateInsight, CompanyInsight } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateInsights } from './candidate-insights';
import { CompanyInsights } from './company-insights';
import { PlatformInsights } from './platform-insights';

const calculateAggregatedScore = (
  evaluations: Evaluation[]
): { score: number; criteria: Record<string, number> } => {
  if (evaluations.length === 0) return { score: 0, criteria: {} };

  const allCriteriaScores: Record<string, { total: number; count: number }> = {};
  let totalScore = 0;

  evaluations.forEach((ev) => {
    totalScore += ev.score;
    if (ev.criteriaScores) {
        for (const key in ev.criteriaScores) {
            if (!allCriteriaScores[key]) {
                allCriteriaScores[key] = { total: 0, count: 0 };
            }
            allCriteriaScores[key].total += ev.criteriaScores[key];
            allCriteriaScores[key].count++;
        }
    }
  });

  const finalScore = Math.round(totalScore / evaluations.length);
  const finalCriteriaScores: Record<string, number> = {};
  for(const key in allCriteriaScores) {
      finalCriteriaScores[key] = Math.round(allCriteriaScores[key].total / allCriteriaScores[key].count);
  }

  return { score: finalScore, criteria: finalCriteriaScores };
};


export default async function IntelligenceHubPage() {
    const [allUsers, allSubmissions, allEvaluations, allCompanies] = await Promise.all([
        getUsers(),
        getSubmissions(),
        getAllEvaluations(),
        getCompanies(),
    ]);

    const candidates = allUsers.filter((u) => u.role === 'candidate');

    const unsortedRankingData: Omit<CandidateInsight, 'percentileRank'>[] = candidates.map((candidate) => {
        const candidateEvals = allEvaluations.filter((ev) => allSubmissions.some(s => s.id === ev.submissionId && s.userId === candidate.id))
            .sort((a,b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

        if (candidateEvals.length === 0) return null;

        const { score, criteria } = calculateAggregatedScore(candidateEvals);
        
        let trend: CandidateInsight['trend'] = 'new';
        if (candidateEvals.length > 1) {
            const latestScore = candidateEvals[0].score;
            const previousScore = candidateEvals[1].score;
            if (latestScore > previousScore) trend = 'improving';
            else if (latestScore < previousScore) trend = 'declining';
            else trend = 'stable';
        }

        const criteriaEntries = Object.entries(criteria);
        const topSkill = criteriaEntries.length > 0 ? criteriaEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0] : null;
        const weakestSkill = criteriaEntries.length > 0 ? criteriaEntries.reduce((a, b) => a[1] < b[1] ? a : b)[0] : null;
        
        return {
            candidate,
            aggregatedScore: score,
            evaluationCount: candidateEvals.length,
            trend,
            topSkill,
            weakestSkill,
        };
    }).filter((r): r is Omit<CandidateInsight, 'percentileRank'> => r !== null);

    const sortedData = unsortedRankingData.sort((a, b) => b.aggregatedScore - a.aggregatedScore);
    const totalCandidates = sortedData.length;

    const candidateInsights: CandidateInsight[] = sortedData.map((candidate, index) => ({
        ...candidate,
        percentileRank: totalCandidates > 0 ? Math.ceil(((index + 1) / totalCandidates) * 100) : 0,
    }));
    
    const companyInsights: CompanyInsight[] = allCompanies.map(company => {
        const companyUserIds = new Set(allUsers.filter(u => u.companyId === company.id).map(u => u.id));
        const companyCandidateInsights = candidateInsights.filter(insight => {
            const submission = allSubmissions.find(s => s.userId === insight.candidate.id);
            return submission && submission.companyId === company.id;
        });

        const avgCandidateScore = companyCandidateInsights.length > 0 
            ? Math.round(companyCandidateInsights.reduce((acc, ci) => acc + ci.aggregatedScore, 0) / companyCandidateInsights.length) 
            : 0;

        const allCriteria: Record<string, number[]> = {};
        allEvaluations.forEach(ev => {
            const submission = allSubmissions.find(s => s.id === ev.submissionId);
            if (submission && submission.companyId === company.id && ev.criteriaScores) {
                Object.entries(ev.criteriaScores).forEach(([key, value]) => {
                    if (!allCriteria[key]) allCriteria[key] = [];
                    allCriteria[key].push(value);
                });
            }
        });
        
        const avgCriteriaScores = Object.entries(allCriteria).map(([key, values]) => ({
            name: key,
            score: values.reduce((a, b) => a + b, 0) / values.length,
        })).sort((a,b) => b.score - a.score);

        return {
            company,
            candidateCount: companyCandidateInsights.length,
            avgCandidateScore,
            topSkills: avgCriteriaScores.slice(0, 2).map(s => s.name),
            skillGaps: avgCriteriaScores.slice(-2).map(s => s.name),
        };
    });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Internal Intelligence Hub
            </h2>
            <p className="text-muted-foreground">
                High-level insights into candidate, company, and platform performance.
            </p>
            </div>
        </div>
      
        <Tabs defaultValue="candidates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="candidates">Candidate Insights</TabsTrigger>
                <TabsTrigger value="companies">Company Insights</TabsTrigger>
                <TabsTrigger value="platform">Platform-wide Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="candidates" className="mt-6">
                <CandidateInsights insights={candidateInsights} />
            </TabsContent>
            <TabsContent value="companies" className="mt-6">
                <CompanyInsights insights={companyInsights} />
            </TabsContent>
            <TabsContent value="platform" className="mt-6">
                <PlatformInsights allEvaluations={allEvaluations} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
