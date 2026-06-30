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
  Globe,
  CalendarDays,
  ArrowLeft,
  ExternalLink,
  KeyRound,
  Lightbulb,
  PenLine,
  Send,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsite } from '@/lib/queries/cms-websites.queries';
import { useWorkflowStats } from '@/lib/queries/cms-workflow.queries';
import { useCmsStore } from '@/lib/store/cmsStore';
import { useUIStore } from '@/lib/store/uiStore';
import WebsiteDashboard from '@/components/cms/dashboard/WebsiteDashboard';
import { Separator } from '@/components/ui/separator';

// The site dashboard is the first screen after choosing a website, so every label
// here is written for someone who has never used a CMS: plain verbs, no jargon
// ("taxonomy" → "sections", "meta defaults" → "how it looks on Google"). Tools are
// grouped by what you're trying to DO, and the order roughly follows the workflow:
// create → review → go live → manage.
type ToolLink = {
  title: string;
  description: string;
  icon: typeof FileText;
  segment: string;
  color: string;
  /** The one most people should open first. */
  highlight?: boolean;
  /** Show the live "pending review" count from workflowStats on this card. */
  showPending?: boolean;
};

const LINK_GROUPS: { heading: string; blurb: string; links: ToolLink[] }[] = [
  {
    heading: 'Create & organize',
    blurb: 'Add content and keep it tidy.',
    links: [
      {
        title: 'Content',
        description: 'Write and publish pages, posts and articles. Most people start here.',
        icon: FileText,
        segment: 'content',
        color: 'text-blue-500',
        highlight: true,
      },
      {
        title: 'Categories',
        description: 'Group content into sections (like Banking or News) so visitors can find it.',
        icon: FolderOpen,
        segment: 'categories',
        color: 'text-amber-500',
      },
      {
        title: 'Authors',
        description: 'Manage contributor profiles (bio, credentials, photo) that power bylines and author pages.',
        icon: Users,
        segment: 'authors',
        color: 'text-teal-500',
      },
      {
        title: 'Media',
        description: 'Upload and reuse images, videos and files inside your content.',
        icon: Image,
        segment: 'media',
        color: 'text-purple-500',
      },
    ],
  },
  {
    heading: 'Review & go live',
    blurb: 'Approve content and help people find it.',
    links: [
      {
        title: 'Approvals',
        description: 'Content waiting to be reviewed before it goes live. Approve it here.',
        icon: GitBranch,
        segment: 'workflows',
        color: 'text-green-500',
        showPending: true,
      },
      {
        title: 'Content Calendar',
        description: 'See scheduled and published content on a calendar. Drag to reschedule.',
        icon: CalendarDays,
        segment: 'calendar',
        color: 'text-violet-500',
      },
      {
        title: 'SEO',
        description: 'How the site appears on Google — page titles, sitemap and redirects.',
        icon: Search,
        segment: 'seo',
        color: 'text-rose-500',
      },
    ],
  },
  {
    heading: 'Site settings',
    blurb: 'Who can edit, and what the site connects to.',
    links: [
      {
        title: 'User Management',
        description: 'Invite users, set roles, suspend accounts and reset passwords.',
        icon: Users,
        segment: 'members',
        color: 'text-cyan-500',
      },
      {
        title: 'Integrations & Keys',
        description: 'Connect payment and other services using their API keys.',
        icon: KeyRound,
        segment: 'integrations',
        color: 'text-orange-500',
      },
    ],
  },
];

const HOW_IT_WORKS = [
  {
    icon: PenLine,
    title: '1. Add content',
    text: 'Open Content and create a page, post or article. It saves as a draft — not visible to the public yet.',
  },
  {
    icon: Send,
    title: '2. Publish or schedule',
    text: 'Hit Publish to push it live now, or pick a date and it goes live automatically at that time.',
  },
  {
    icon: Globe,
    title: '3. It appears on the site',
    text: 'Published content shows on the live website within about 2 minutes. That’s it.',
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
  // Stats/workflow endpoints key off the canonical UUID. :websiteId may now be a
  // slug, so resolve it via the loaded website before hitting those services.
  const canonicalId = website?.id ?? '';
  const { data: workflowStats } = useWorkflowStats(canonicalId);

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

  const pendingCount = workflowStats?.pending ?? 0;

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
          description={`You're managing the content for ${website.domain}. Pick a tool below to get started.`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`https://${website.domain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View live site
                </a>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/cms/websites/${websiteId}/content`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Add / edit content
                </Link>
              </Button>
            </div>
          }
        />
      </div>

      {/* Dashboard overview — metrics, analytics and operational widgets */}
      <WebsiteDashboard websiteId={websiteId} canonicalId={canonicalId} website={website} />

      <Separator />

      {/* New here? — plain-language explainer of the publish flow */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            New here? Here’s how publishing works
          </CardTitle>
          <CardDescription className="text-xs">
            Three steps from writing something to it being live on the website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.title} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" className="mt-4" asChild>
            <Link href={`/cms/websites/${websiteId}/content`}>
              Start adding content
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* What this site can have — explain "modules" in human terms */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          This site can have these kinds of content:
        </span>
        {website.modules.map((m) => (
          <Badge key={m} variant="secondary" className="text-xs capitalize">
            {m}
          </Badge>
        ))}
      </div>

      {/* Tools, grouped by what you're trying to do */}
      {LINK_GROUPS.map((group) => (
        <section key={group.heading} className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">{group.heading}</h2>
            <p className="text-xs text-muted-foreground">{group.blurb}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.links.map((link) => (
              <Link key={link.title} href={`/cms/websites/${websiteId}/${link.segment}`}>
                <Card
                  className={`h-full cursor-pointer transition-shadow hover:shadow-md ${
                    link.highlight ? 'border-primary/40 ring-1 ring-primary/20' : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <link.icon className={`mt-0.5 h-5 w-5 shrink-0 ${link.color}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">{link.title}</CardTitle>
                          {link.highlight && (
                            <Badge className="h-4 px-1.5 text-[10px]">Start here</Badge>
                          )}
                          {link.showPending && pendingCount > 0 && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                              {pendingCount} waiting
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-0.5 text-xs">
                          {link.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
