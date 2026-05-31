'use client';

import { useEffect } from 'react';
import { Briefcase, Users, FileText } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { useJobsList } from '@/lib/queries/jobs.queries';
import type { JobRow } from '@/lib/api/jobs';

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  open: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  draft: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function JobsAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data, isLoading } = useJobsList({ limit: 50 });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Jobs' }]);
  }, [setBreadcrumbs]);

  const jobs: JobRow[] = data?.data?.items ?? [];
  const total = data?.data?.pagination?.total ?? jobs.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talent & Jobs"
        description="Manage job listings, applications, and candidates (jobs-service)"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-12" /> : total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-sm text-muted-foreground">View in Candidates</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-sm text-muted-foreground">View in Applications</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Job Listings</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : jobs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No job listings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Location</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{j.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{j.location || '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{j.employment_type || '—'}</td>
                      <td className="py-2 pr-4">
                        <Badge className={STATUS_COLORS[String(j.status)] ?? 'bg-gray-100 text-gray-600'}>
                          {String(j.status ?? 'unknown')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
