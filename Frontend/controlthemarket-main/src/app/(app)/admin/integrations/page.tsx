
import { getGitHubRepositories } from "@/lib/api";
import { GitHubIntegrationDashboard } from "./github-dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function GitHubIntegrationPage() {
  const repositories = await getGitHubRepositories();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                GitHub Integration
            </h2>
            <p className="text-muted-foreground">
                Manage and monitor all connected GitHub repositories.
            </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Connected Repositories</CardTitle>
            <CardDescription>
                An overview of all repositories linked to submissions and tasks.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <GitHubIntegrationDashboard initialData={repositories} />
        </CardContent>
      </Card>
    </div>
  );
}
