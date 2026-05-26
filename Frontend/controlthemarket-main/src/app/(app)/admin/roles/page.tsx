
import { getTasks, getSubmissions, getAllEvaluations } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RoleCategory } from "@/lib/types";
import { Code, Palette, Megaphone, Briefcase, Database, ArrowRight } from 'lucide-react';
import Link from "next/link";

const ROLE_ICONS: Record<RoleCategory, React.ElementType> = {
    Engineering: Code,
    Design: Palette,
    Marketing: Megaphone,
    Business: Briefcase,
    Data: Database,
    // Add sub-roles if they need specific icons, otherwise they can default
    Frontend: Code,
    Backend: Code,
    'Full Stack': Code,
    DevOps: Code,
    Mobile: Code,
    'UI/UX Design': Palette,
    'Graphic Design': Palette,
    'Product Design': Palette,
    'Motion Design': Palette,
    'Digital Marketing': Megaphone,
    SEO: Megaphone,
    'Content Marketing': Megaphone,
    'Performance Marketing': Megaphone,
    Sales: Briefcase,
    Operations: Briefcase,
    'Business Development': Briefcase,
    Strategy: Briefcase,
    'Data Analyst': Database,
    'Data Scientist': Database,
    'Machine Learning Engineer': Database
};

export default async function RoleDashboardsPage() {
    const [tasks, submissions, evaluations] = await Promise.all([
        getTasks(),
        getSubmissions(),
        getAllEvaluations(),
    ]);

    const roleCategories: RoleCategory[] = ['Engineering', 'Design', 'Marketing', 'Business', 'Data'];

    const roleStats = roleCategories.map(category => {
        const categoryTasks = tasks.filter(t => t.roleCategory === category);
        const categoryTaskIds = new Set(categoryTasks.map(t => t.id));

        const categorySubmissions = submissions.filter(s => categoryTaskIds.has(s.taskId));
        const categorySubmissionIds = new Set(categorySubmissions.map(s => s.id));

        const categoryEvaluations = evaluations.filter(e => categorySubmissionIds.has(e.submissionId));

        const activeTasks = categoryTasks.filter(t => t.status === 'published').length;
        const totalSubmissionsForRole = categorySubmissions.length;
        const averageScore = categoryEvaluations.length > 0
            ? Math.round(categoryEvaluations.reduce((acc, ev) => acc + ev.score, 0) / categoryEvaluations.length)
            : 0;

        return {
            name: category,
            activeTasks,
            totalSubmissions: totalSubmissionsForRole,
            averageScore
        };
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                <h2 className="font-headline text-3xl font-bold tracking-tight">
                    Role Dashboards
                </h2>
                <p className="text-muted-foreground">
                    An overview of activity for each professional vertical.
                </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roleStats.map(role => {
                    const Icon = ROLE_ICONS[role.name];
                    return (
                        <Card key={role.name} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    <span>{role.name}</span>
                                </CardTitle>
                                <CardDescription>Key metrics for the {role.name} vertical.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 flex-grow">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Active Tasks</span>
                                    <span className="font-bold">{role.activeTasks}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Total Submissions</span>
                                    <span className="font-bold">{role.totalSubmissions}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Average Score</span>
                                    <span className="font-bold">{role.averageScore > 0 ? `${role.averageScore}%` : 'N/A'}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" variant="outline" asChild>
                                  <Link href={`/admin/analytics/roles/${role.name.toLowerCase()}`}>
                                    View Analytics <ArrowRight className="ml-2 h-4 w-4" />
                                  </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
