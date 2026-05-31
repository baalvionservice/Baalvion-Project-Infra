import {
  getUser,
  getSubmissionsByUser,
  getAllEvaluations,
  getTasks,
  getUsers,
} from "@/lib/api";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  CheckCircle,
  Star,
  Github,
  Linkedin,
  Globe,
  Share2,
  Briefcase,
  MapPin,
  ShieldCheck,
  Rocket,
  Award,
  BrainCircuit,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import type {
  Evaluation,
  RoleCategory,
  Submission,
  User,
  Badge as BadgeType,
} from "@/lib/types";
import { badges as mockBadges } from '@/lib/badges';
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const badgeIcons: { [key: string]: React.ElementType } = {
  Trophy,
  ShieldCheck,
  Rocket,
  Award,
  BrainCircuit,
};

// Copied from leaderboard page for ranking logic
const calculateAggregatedScore = (evaluations: Evaluation[]): number => {
  if (evaluations.length === 0) return 0;
  const totalScore = evaluations.reduce((acc, curr) => acc + curr.score, 0);
  return Math.round(totalScore / evaluations.length);
};

export default async function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getUser(id);

  if (!candidate || candidate.role !== "candidate") {
    notFound();
  }

  const [submissions, allEvaluations, allTasks, allUsers] = await Promise.all([
    getSubmissionsByUser(id),
    getAllEvaluations(),
    getTasks(),
    getUsers(),
  ]);

  // --- START: Ranking Logic (copied and adapted from leaderboard) ---
  const allCandidates = allUsers.filter((u) => u.role === "candidate");
  const unsortedRankingData = allCandidates
    .map((c) => {
      const candidateSubmissions = submissions.filter((s) => s.userId === c.id);
      const candidateSubmissionIds = new Set(
        candidateSubmissions.map((s) => s.id)
      );
      const candidateEvaluations = allEvaluations.filter((ev) =>
        candidateSubmissionIds.has(ev.submissionId)
      );
      if (candidateEvaluations.length === 0) return null;
      const score = calculateAggregatedScore(candidateEvaluations);
      return { candidateId: c.id, score };
    })
    .filter((r): r is { candidateId: string; score: number } => r !== null);

  const sortedData = unsortedRankingData.sort((a, b) => b.score - a.score);
  const rank =
    sortedData.findIndex((item) => item.candidateId === candidate.id) + 1;
  // --- END: Ranking Logic ---

  const candidateEvaluations = allEvaluations.filter((ev) =>
    submissions.some((s) => s.id === ev.submissionId)
  );
  const overallScore = calculateAggregatedScore(candidateEvaluations);

  const completedSubmissions = submissions.filter((s) =>
    ["evaluated", "shortlisted", "rejected", "moved-to-next-round"].includes(
      s.status
    )
  );

  const tasksCompleted = completedSubmissions.length;
  const completionRate =
    submissions.length > 0
      ? Math.round((tasksCompleted / submissions.length) * 100)
      : 0;

  const averageScore =
    candidateEvaluations.length > 0
      ? Math.round(
          candidateEvaluations.reduce((acc, ev) => acc + ev.score, 0) /
            candidateEvaluations.length
        )
      : 0;

  const submissionsWithDetails = completedSubmissions
    .map((sub) => {
      const task = allTasks.find((t) => t.id === sub.taskId);
      const evaluation = candidateEvaluations.find(
        (e) => e.submissionId === sub.id
      );
      return {
        ...sub,
        task,
        evaluation,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score > 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const getPrimaryRole = (): RoleCategory | undefined => {
    const taskIds = new Set(submissions.map((s) => s.taskId));
    const candidateTasks = allTasks.filter((t) => taskIds.has(t.id));
    if (candidateTasks.length > 0) {
      const roleCounts = candidateTasks.reduce((acc, task) => {
        acc[task.roleCategory] = (acc[task.roleCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return Object.keys(roleCounts).reduce((a, b) =>
        roleCounts[a] > roleCounts[b] ? a : b
      ) as RoleCategory;
    }
    return undefined;
  };
  const primaryRole = getPrimaryRole();

  return (
    <div className="flex-1 bg-muted/20 pb-20">
      {/* Header with banner and avatar */}
      <div className="relative h-48 w-full bg-muted">
        <Image
          src={`https://picsum.photos/seed/${candidate.id}/1200/300`}
          alt={`${candidate.name}'s banner`}
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="overflow-hidden text-center">
              <CardContent className="p-6 pt-12">
                <Avatar className="h-28 w-28 mx-auto border-4 border-background shadow-lg">
                  <AvatarImage
                    src={candidate.profile?.avatarUrl}
                    alt={candidate.name}
                  />
                  <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="mt-4 font-headline text-2xl font-bold">
                  {candidate.name}
                </h1>
                {primaryRole && (
                  <p className="text-muted-foreground">{primaryRole}</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                  {candidate.profile?.bio}
                </p>
                {candidate.profile?.location && (
                  <div className="mt-4 flex justify-center items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{candidate.profile.location}</span>
                  </div>
                )}
                <div className="mt-4 flex justify-center gap-2">
                  {candidate.profile?.githubUrl && (
                    <Button asChild variant="outline" size="icon">
                      <Link href={candidate.profile.githubUrl} target="_blank">
                        <Github className="h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                  {candidate.profile?.linkedinUrl && (
                    <Button asChild variant="outline" size="icon">
                      <Link
                        href={candidate.profile.linkedinUrl}
                        target="_blank"
                      >
                        <Linkedin className="h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                  {candidate.profile?.portfolioLinks?.[0] && (
                    <Button asChild variant="outline" size="icon">
                      <Link
                        href={candidate.profile.portfolioLinks[0]}
                        target="_blank"
                      >
                        <Globe className="h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {candidate.profile?.badgeIds &&
                candidate.profile.badgeIds.length > 0 ? (
                  candidate.profile.badgeIds.map((badgeId) => {
                    const badge = mockBadges.find((b) => b.id === badgeId);
                    if (!badge) return null;
                    const Icon = badgeIcons[badge.icon];
                    const rarityColors = {
                      Elite: "border-yellow-400/50 bg-yellow-400/10",
                      Rare: "border-purple/50 bg-purple/10",
                      Common: "border-border",
                    };
                    return (
                      <div
                        key={badge.id}
                        className={cn(
                          "flex items-center gap-4 rounded-md border p-3",
                          rarityColors[badge.rarity]
                        )}
                      >
                        <Icon className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold">{badge.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No badges earned yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {candidate.profile?.experienceLevel && (
                  <Badge variant="secondary" className="text-base">
                    {candidate.profile.experienceLevel}
                  </Badge>
                )}
                {candidate.profile?.skills &&
                  candidate.profile.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                {(!candidate.profile?.skills ||
                  candidate.profile.skills.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No skills listed.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Global Rank
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    #{rank > 0 ? rank : "N/A"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{averageScore}/100</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tasks Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{tasksCompleted}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks</CardTitle>
                <CardDescription>
                  A showcase of the candidate's evaluated work.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissionsWithDetails.length > 0 ? (
                      submissionsWithDetails.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <p className="font-medium">{sub.task?.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {sub.task?.roleCategory}
                            </p>
                          </TableCell>
                          <TableCell>
                            {format(new Date(sub.lastUpdated), "PPP")}
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold text-lg ${getScoreColor(
                              sub.evaluation?.score || 0
                            )}`}
                          >
                            {sub.evaluation?.score ?? "N/A"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          No completed tasks to display yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
