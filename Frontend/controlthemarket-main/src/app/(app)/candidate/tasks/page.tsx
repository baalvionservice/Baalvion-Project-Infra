import { getTasks, getCompanies } from "@/lib/api";
import { TaskList } from "./task-list";
import type { TaskWithCompany } from "./task-list";

// Reads live ControlTheMarket data through @/lib/api, which throws CtmDataError when
// ctm-service is unreachable rather than showing placeholder data. Prerendering this at
// build time therefore fails; it is a per-request view, not a static page.
export const dynamic = 'force-dynamic';

export default async function RoleTasksPage() {
  const [tasks, companies] = await Promise.all([getTasks(), getCompanies()]);

  const tasksWithCompany: TaskWithCompany[] = tasks.map((task) => {
    const company = companies.find((c) => c.id === task.companyId);
    return {
      ...task,
      companyName: company?.name || "Unknown Company",
      companyLogo: company?.logoUrl,
    };
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Find Your Next Challenge
          </h2>
          <p className="text-muted-foreground">
            Browse tasks available for your role. Defaulting to Engineering
            tasks.
          </p>
        </div>
      </div>
      <TaskList tasks={tasksWithCompany} />
    </div>
  );
}
