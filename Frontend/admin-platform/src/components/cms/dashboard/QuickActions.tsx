'use client';

import Link from 'next/link';
import { FileText, FilePlus2, FolderPlus, ImagePlus, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  websiteId: string;
}

interface Action {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

export default function QuickActions({ websiteId }: Props) {
  const base = `/cms/websites/${websiteId}`;
  const actions: Action[] = [
    { label: 'New Article', icon: FileText, href: `${base}/content?type=article`, color: 'text-blue-500' },
    { label: 'New Page', icon: FilePlus2, href: `${base}/content?type=page`, color: 'text-violet-500' },
    { label: 'New Category', icon: FolderPlus, href: `${base}/categories`, color: 'text-amber-500' },
    { label: 'Upload Media', icon: ImagePlus, href: `${base}/media`, color: 'text-purple-500' },
    { label: 'Invite User', icon: UserPlus, href: `${base}/members`, color: 'text-cyan-500' },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-2.5">
          {actions.map((a, i) => {
            const Icon = a.icon;
            // Make the primary action span both columns for a stronger entry point.
            const wide = i === 0;
            return (
              <Link
                key={a.label}
                href={a.href}
                className={cn(
                  'group flex items-center gap-2.5 rounded-lg border bg-muted/20 p-3 transition-all hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted/50 hover:shadow-sm',
                  wide && 'col-span-2',
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background shadow-sm ring-1 ring-border/50">
                  <Icon className={cn('h-4 w-4', a.color)} />
                </span>
                <span className="text-xs font-medium">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
