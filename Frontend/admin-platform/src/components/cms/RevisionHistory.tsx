'use client';

import { Clock, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useContentRevisions, useRestoreRevision } from '@/lib/queries/cms-content.queries';
import { formatDateTime } from '@/lib/utils/format';

interface Props {
  contentId: string;
  currentVersion?: number;
}

export default function RevisionHistory({ contentId, currentVersion }: Props) {
  const { data: revisions, isLoading } = useContentRevisions(contentId);
  const { mutate: restore, isPending } = useRestoreRevision(contentId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!revisions?.length) {
    return (
      <div className="p-4 text-center text-xs text-muted-foreground">
        No revision history yet.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {revisions.map((rev) => {
          const isCurrent = rev.version === currentVersion;
          return (
            <div
              key={rev.id}
              className={`group flex items-start gap-3 rounded-lg p-2.5 transition-colors ${
                isCurrent ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                v{rev.version}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{rev.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {rev.editedBy.fullName} · {formatDateTime(rev.createdAt)}
                </p>
                {rev.changeNote && (
                  <p className="text-[11px] text-muted-foreground italic mt-0.5 truncate">
                    &quot;{rev.changeNote}&quot;
                  </p>
                )}
              </div>
              {!isCurrent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  title="Restore this version"
                  disabled={isPending}
                  onClick={() => restore(rev.id)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              {isCurrent && (
                <span className="text-[10px] text-primary font-medium shrink-0">Current</span>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
