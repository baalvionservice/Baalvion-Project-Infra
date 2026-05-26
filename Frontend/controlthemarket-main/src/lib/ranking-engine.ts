import {
  getHybridUsers,
  getHybridSubmissions,
  getHybridEvaluations,
  getHybridTasks,
} from "./data-layer";
import * as api from "./api";
import type {
  User,
  Evaluation,
  Submission,
  EvaluationSchema,
  Task,
  RoleCategory,
} from "./types";

// Centralized score calculation logic
export const calculateAggregatedScore = (
  evaluations: Evaluation[],
  schemas: EvaluationSchema[]
): { score: number; criteria: Record<string, number> } => {
  if (evaluations.length === 0) return { score: 0, criteria: {} };

  let totalWeightedScore = 0;
  const allCriteriaScores: Record<string, { total: number; count: number }> =
    {};

  evaluations.forEach((ev) => {
    // For simplicity in mock, we use the first schema. A real app would link schemas to tasks.
    const schema = schemas.length > 0 ? schemas[0] : null;
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

    // Fallback to simple score if no criteria match or no schema
    if (evaluationTotalWeight === 0) {
      totalWeightedScore += ev.score;
    } else {
      totalWeightedScore +=
        (evaluationWeightedScore / evaluationTotalWeight) * 100;
    }
  });

  const finalScore = Math.round(totalWeightedScore / evaluations.length);

  const finalCriteriaScores: Record<string, number> = {};
  for (const key in allCriteriaScores) {
    finalCriteriaScores[key] = Math.round(
      allCriteriaScores[key].total / allCriteriaScores[key].count
    );
  }

  return { score: finalScore, criteria: finalCriteriaScores };
};

export interface UserPerformance {
  userId: string;
  totalSubmissions: number;
  evaluatedCount: number;
  approvedCount: number;
  rejectedCount: number;
  averageScore: number;
  successRate: number;
  criteriaScores: Record<string, number>;
  primaryRole?: RoleCategory;
}

export async function getUserPerformance(
  userId: string,
  allSubmissions: Submission[],
  allEvaluations: Evaluation[],
  allTasks: Task[],
  allSchemas: EvaluationSchema[]
): Promise<UserPerformance | null> {
  const candidateSubmissions = allSubmissions.filter(
    (sub) => sub.userId === userId
  );
  if (candidateSubmissions.length === 0) return null;

  const evaluatedSubmissions = candidateSubmissions.filter((s) =>
    ["evaluated", "shortlisted", "rejected", "moved-to-next-round"].includes(
      s.status
    )
  );
  const evaluatedSubmissionIds = new Set(evaluatedSubmissions.map((s) => s.id));
  const candidateEvaluations = allEvaluations.filter((ev) =>
    evaluatedSubmissionIds.has(ev.submissionId)
  );

  if (candidateEvaluations.length === 0) {
    return {
      userId,
      totalSubmissions: candidateSubmissions.length,
      evaluatedCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      averageScore: 0,
      successRate: 0,
      criteriaScores: {},
    };
  }

  const { score, criteria } = calculateAggregatedScore(
    candidateEvaluations,
    allSchemas
  );

  const approvedCount = evaluatedSubmissions.filter((s) =>
    ["shortlisted", "moved-to-next-round"].includes(s.status)
  ).length;
  const rejectedCount = evaluatedSubmissions.filter(
    (s) => s.status === "rejected"
  ).length;

  const successRate =
    evaluatedSubmissions.length > 0
      ? Math.round((approvedCount / evaluatedSubmissions.length) * 100)
      : 0;

  // Determine primary role
  const taskIds = new Set(candidateSubmissions.map((s) => s.taskId));
  const candidateTasks = allTasks.filter((t) => taskIds.has(t.id));
  let primaryRole: RoleCategory | undefined;
  if (candidateTasks.length > 0) {
    const roleCounts = candidateTasks.reduce((acc, task) => {
      acc[task.roleCategory] = (acc[task.roleCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    primaryRole = Object.keys(roleCounts).reduce((a, b) =>
      roleCounts[a] > roleCounts[b] ? a : b
    ) as RoleCategory;
  }

  return {
    userId,
    totalSubmissions: candidateSubmissions.length,
    evaluatedCount: candidateEvaluations.length,
    approvedCount,
    rejectedCount,
    averageScore: score,
    successRate,
    criteriaScores: criteria,
    primaryRole,
  };
}

export interface LeaderboardRanking {
  rank: number;
  candidate: User;
  aggregatedScore: number;
  evaluationCount: number;
  primaryRole?: RoleCategory;
  tasksCompleted: number;
  percentileRank: number;
  criteriaScores: Record<string, number>;
}

export async function getLeaderboard(): Promise<LeaderboardRanking[]> {
  const allUsers = await getHybridUsers();
  const allSubmissions = await getHybridSubmissions();
  const allEvaluations = await getHybridEvaluations();
  const allTasks = await getHybridTasks();
  const allSchemas = await api.getEvaluationSchemas(); // This one doesn't have a hybrid layer yet.

  const candidates = allUsers.filter((u) => u.role === "candidate");

  const performances = await Promise.all(
    candidates.map((c) =>
      getUserPerformance(
        c.id,
        allSubmissions,
        allEvaluations,
        allTasks,
        allSchemas
      )
    )
  );

  const unsortedRankingData = performances
    .map((perf, index) => {
      if (!perf || perf.evaluatedCount === 0) return null;
      return {
        candidate: candidates[index],
        aggregatedScore: perf.averageScore,
        evaluationCount: perf.evaluatedCount,
        criteriaScores: perf.criteriaScores,
        primaryRole: perf.primaryRole,
        tasksCompleted: perf.totalSubmissions,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const sortedData = unsortedRankingData.sort(
    (a, b) => (b?.aggregatedScore || 0) - (a?.aggregatedScore || 0)
  );
  const totalCandidates = sortedData.length;

  const leaderboard: LeaderboardRanking[] = sortedData.map((data, index) => {
    const rank = index + 1;
    const percentileRank =
      totalCandidates > 0 ? Math.ceil((rank / totalCandidates) * 100) : 0;
    return {
      ...data,
      rank,
      percentileRank,
    };
  });

  return leaderboard;
}
