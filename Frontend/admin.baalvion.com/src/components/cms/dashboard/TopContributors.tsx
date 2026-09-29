'use client';

import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';
import { formatNumber, initials } from '@/lib/utils/format';
import type { ContributorRow } from './dashboard-data';

interface Props {
  contributors: ContributorRow[];
}

const RANK_COLOR = ['text-amber-400', 'text-zinc-300', 'text-orange-400'];

export default function TopContributors({ contributors }: Props) {
  const max = Math.max(1, ...contributors.map((c) => c.articles));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-amber-500" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {contributors.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No contributors yet.
          </p>
        ) : (
          contributors.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3">
              <span
                className={cn(
                  'w-4 shrink-0 text-center text-xs font-bold tabular-nums',
                  RANK_COLOR[i] ?? 'text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-[11px]">
                  {initials(c.name || '—')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium">{c.name || 'Unknown'}</p>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {formatNumber(c.articles)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${(c.articles / max) * 100}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{c.role}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
