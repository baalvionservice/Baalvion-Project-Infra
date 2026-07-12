'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';

interface SeoOverview {
  articlesAudited: number;
  cleanArticles: number;
  issueCounts: Record<string, number>;
  flagged: Array<{ id: string; title: string; url: string; issues: Array<{ code: string; message: string }> }>;
}

const ISSUE_LABEL: Record<string, string> = {
  title_too_short: 'Title too short',
  title_too_long: 'Title too long',
  summary_missing_or_short: 'Summary missing/short',
  missing_image: 'Missing image',
  duplicate_title: 'Duplicate title',
};

export default function NewsSeoPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'SEO' }]); }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['news', 'admin-seo-overview'],
    queryFn: () => serviceClients.news.get('/seo/overview').then((r) => r.data.data as SeoOverview),
  });

  const issueEntries = Object.entries(data?.issueCounts ?? {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Audit"
        description="Real rule-based checks over article metadata — title length, summary presence, image presence, duplicate titles"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Articles Audited</p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : data?.articlesAudited ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Clean
            </p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : data?.cleanArticles ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Flagged
            </p>
            <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-7 w-14" /> : (data?.flagged?.length ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issues by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : issueEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No issues found</p>
            ) : (
              issueEntries.map(([code, count]) => (
                <div key={code} className="flex items-center justify-between text-xs">
                  <span>{ISSUE_LABEL[code] ?? code}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flagged Articles</CardTitle>
            <CardDescription>Most recent articles with at least one issue</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : !data?.flagged?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nothing flagged</p>
            ) : (
              <div className="space-y-2">
                {data.flagged.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 border-b last:border-0 hover:bg-muted/50 rounded px-1 -mx-1"
                  >
                    <p className="text-xs font-medium truncate">{a.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.issues.map((issue) => (
                        <Badge key={issue.code} variant="secondary" className="text-[10px]">{ISSUE_LABEL[issue.code] ?? issue.code}</Badge>
                      ))}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
