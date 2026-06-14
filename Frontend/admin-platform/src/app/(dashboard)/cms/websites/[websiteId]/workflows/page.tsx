'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, CalendarClock, FileEdit } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WorkflowPipeline from '@/components/cms/workflow/WorkflowPipeline';
import ApprovalQueue from '@/components/cms/workflow/ApprovalQueue';
import ReviewerPanel from '@/components/cms/workflow/ReviewerPanel';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useWorkflowStats } from '@/lib/queries/cms-workflow.queries';
import { useCmsPermissions } from '@/lib/queries/cms-permissions.queries';
import { useUIStore } from '@/lib/store/uiStore';

export default function WebsiteWorkflowsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();

  const { data: website } = useWebsite(websiteId);
  const canonicalId = website?.id ?? '';
  const { data: stats } = useWorkflowStats(canonicalId);
  const perms = useCmsPermissions(canonicalId);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'CMS', href: '/cms' },
      { label: website?.name ?? '...', href: `/cms/websites/${websiteId}` },
      { label: 'Workflow' },
    ]);
  }, [website, setBreadcrumbs, websiteId]);

  const summary = [
    { label: 'Pending review', value: stats?.pending ?? 0, icon: Clock, color: 'text-yellow-500' },
    { label: 'Drafts', value: stats?.draft ?? 0, icon: FileEdit, color: 'text-amber-500' },
    { label: 'Scheduled', value: stats?.scheduled ?? 0, icon: CalendarClock, color: 'text-violet-500' },
    { label: 'Published', value: stats?.published ?? 0, icon: CheckCircle, color: 'text-green-500' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href={`/cms/websites/${websiteId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {website?.name ?? 'Website'}
          </Link>
        </Button>
        <PageHeader
          title="Content Workflow"
          description="Move content from draft to live, review submissions, and assign reviewers"
        />
      </div>

      {/* Stage summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </span>
                  <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {canonicalId && (
        <Tabs defaultValue="pipeline">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="queue">Approval Queue</TabsTrigger>
            <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4">
            <WorkflowPipeline websiteId={websiteId} canonicalId={canonicalId} />
          </TabsContent>

          <TabsContent value="queue" className="mt-4">
            <ApprovalQueue
              websiteId={websiteId}
              canonicalId={canonicalId}
              canReview={perms.canReview}
            />
          </TabsContent>

          <TabsContent value="reviewers" className="mt-4">
            <ReviewerPanel websiteId={websiteId} canonicalId={canonicalId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
