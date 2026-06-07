'use client';

import { FileText, Send, CheckCircle2, Image, UserPlus, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import { formatRelative, truncate } from '@/lib/utils/format';
import type { ActivityEvent, ActivityKind } from './dashboard-data';

const KIND_META: Record<
  ActivityKind,
  { icon: React.ComponentType<{ className?: string }>; color: string; bg: string; verb: string }
> = {
  created: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', verb: 'created' },
  published: { icon: Send, color: 'text-green-500', bg: 'bg-green-500/10', verb: 'published' },
  approved: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', verb: 'approved' },
  media: { icon: Image, color: 'text-purple-500', bg: 'bg-purple-500/10', verb: 'uploaded' },
  user: { icon: UserPlus, color: 'text-cyan-500', bg: 'bg-cyan-500/10', verb: 'joined' },
};

interface Props {
  events: ActivityEvent[];
}

export default function RecentActivity({ events }: Props) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-green-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {events.length === 0 ? (
          <p className="px-6 py-10 text-center text-xs text-muted-foreground">
            No activity yet. Create content to see it here.
          </p>
        ) : (
          <ScrollArea className="h-[300px] px-4">
            <ol className="relative space-y-0 pb-2">
              {events.map((e, i) => {
                const meta = KIND_META[e.kind];
                const Icon = meta.icon;
                const last = i === events.length - 1;
                return (
                  <li key={e.id} className="relative flex gap-3 pb-4">
                    {/* timeline rail */}
                    {!last && (
                      <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border" />
                    )}
                    <span
                      className={cn(
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        meta.bg,
                      )}
                    >
                      <Icon className={cn('h-4 w-4', meta.color)} />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-xs leading-snug">
                        <span className="font-medium">{e.actor}</span>{' '}
                        <span className="text-muted-foreground">{meta.verb}</span>{' '}
                        <span className="font-medium">{truncate(e.title, 48)}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelative(e.at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
