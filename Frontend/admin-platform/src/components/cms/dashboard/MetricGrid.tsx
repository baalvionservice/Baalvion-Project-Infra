'use client';

import {
  FileText,
  CheckCircle2,
  FileEdit,
  CalendarClock,
  GitPullRequestArrow,
  FolderTree,
  FolderOpen,
  Image,
  Users,
  PenLine,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import type { DashboardMetrics } from './dashboard-data';

interface MetricDef {
  key: keyof DashboardMetrics;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accent?: boolean;
}

const METRICS: MetricDef[] = [
  { key: 'totalContent', label: 'Total Content', icon: FileText, color: 'text-blue-500' },
  { key: 'publishedContent', label: 'Published', icon: CheckCircle2, color: 'text-green-500' },
  { key: 'draftContent', label: 'Drafts', icon: FileEdit, color: 'text-amber-500' },
  { key: 'scheduledContent', label: 'Scheduled', icon: CalendarClock, color: 'text-violet-500' },
  { key: 'pendingApprovals', label: 'Pending Approvals', icon: GitPullRequestArrow, color: 'text-rose-500', accent: true },
  { key: 'totalCategories', label: 'Categories', icon: FolderTree, color: 'text-orange-500' },
  { key: 'totalSubcategories', label: 'Subcategories', icon: FolderOpen, color: 'text-yellow-500' },
  { key: 'totalMedia', label: 'Media Files', icon: Image, color: 'text-purple-500' },
  { key: 'totalUsers', label: 'Total Users', icon: Users, color: 'text-cyan-500' },
  { key: 'writers', label: 'Writers', icon: PenLine, color: 'text-sky-500' },
  { key: 'editors', label: 'Editors', icon: UserCog, color: 'text-teal-500' },
  { key: 'admins', label: 'Admins', icon: ShieldCheck, color: 'text-indigo-500' },
];

interface Props {
  metrics: DashboardMetrics;
  loading?: boolean;
}

export default function MetricGrid({ metrics, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {METRICS.map((m) => {
        const Icon = m.icon;
        const value = metrics[m.key];
        const isAlert = m.accent && value > 0;
        return (
          <Card
            key={m.key}
            className={cn(
              'group relative overflow-hidden transition-colors',
              isAlert ? 'border-rose-500/30 bg-rose-500/[0.04]' : 'hover:border-border/80',
            )}
          >
            {/* Subtle corner glow on hover for a more crafted feel */}
            <div
              className={cn(
                'pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100',
                'bg-current',
                m.color,
              )}
            />
            <CardContent className="relative p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {m.label}
                </span>
                <Icon className={cn('h-3.5 w-3.5 shrink-0', m.color)} />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <p
                  className={cn(
                    'text-2xl font-bold tabular-nums leading-none',
                    isAlert && 'text-rose-500',
                  )}
                >
                  {formatNumber(value)}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
