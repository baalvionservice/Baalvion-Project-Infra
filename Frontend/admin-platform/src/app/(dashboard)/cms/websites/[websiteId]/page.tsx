'use client';

import { useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import {
  FileText,
  FolderOpen,
  Image,
  GitBranch,
  Search,
  Users,
  Settings,
  Globe,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsite, useWebsiteStats } from '@/lib/queries/cms-websites.queries';
import { useWorkflowStats } from '@/lib/queries/cms-workflow.queries';
import { useCmsStore } from '@/lib/store/cmsStore';
import { useUIStore } from '@/lib/store/uiStore';

const QUICK_LINKS = [
  {
    title: 'Content',
    description: 'Manage pages, posts & articles',
    icon: FileText,
    href: (id: string) => `/cms/websites/${id}/content`,
    color: 'text-blue-500',
  },
  {
    title: 'Categories',
    description: 'Organise taxonomy tree',
    icon: FolderOpen,
    href: (id: string) => `/cms/websites/${id}/categories`,
    color: 'text-amber-500',
  },
  {
    title: 'Media',
    description: 'Images, videos & files',
    icon: Image,
    href: (id: string) => `/cms/websites/${id}/media`,
    color: 'text-purple-500',
  },
  {
    title: 'Workflows',
    description: 'Pending approvals & review queue',
    icon: GitBranch,
    href: (id: string) => `/cms/websites/${id}/workflows`,
    color: 'text-green-500',
  },
  {
    title: 'SEO',
    description: 'Redirects, sitemaps & meta defaults',
    icon: Search,
    href: (id: string) => `/cms/websites/${id}/seo`,
    color: 'text-rose-500',
  },
  {
    title: 'Members',
    description: 'CMS roles & access control',
    icon: Users,
    href: (id: string) => `/cms/websites/${id}/members`,
    color: 'text-cyan-500',
  },
];

export default function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const { setBreadcrumbs } = useUIStore();
  const setActiveWebsite = useCmsStore((s) => s.setActiveWebsite);

  const { data: website, isLoading } = useWebsite(websiteId);
  const { data: stats } = useWebsiteStats(websiteId);
  const { data: workflowStats } = useWorkflowStats(websiteId);

  useEffect(() => {
    if (website) {
      setActiveWebsite(website);
      setBreadcrumbs([
        { label: 'CMS', href: '/cms' },
        { label: 'Websites', href: '/cms/websites' },
        { label: website.name },
      ]);
    }
  }, [website, setBreadcrumbs, setActiveWebsite]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (!website) return null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link href="/cms/websites">
            <ArrowLeft className="mr-1 h-4 w-4" />
            All Websites
          </Link>
        </Button>
        <PageHeader
          title={website.name}
          description={website.domain}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`https://${website.domain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Site
                </a>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/cms/websites/${websiteId}/content`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Content
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Published', value: stats.publishedContent, color: 'text-green-600' },
            { label: 'Draft', value: stats.draftContent },
            { label: 'Pending Review', value: stats.pendingReview, color: workflowStats?.pending ? 'text-destructive' : undefined },
            { label: 'Media Files', value: stats.totalMedia },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold mt-0.5 ${s.color ?? ''}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Module badges */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Modules:</span>
        {website.modules.map((m) => (
          <Badge key={m} variant="secondary" className="text-xs capitalize">
            {m}
          </Badge>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.title} href={link.href(websiteId)}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <link.icon className={`h-5 w-5 ${link.color}`} />
                  <div>
                    <CardTitle className="text-sm">{link.title}</CardTitle>
                    <CardDescription className="text-xs">{link.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
