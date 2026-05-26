'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecentActivity } from '@/lib/queries/analytics.queries';
import { formatRelative, initials } from '@/lib/utils/format';

export default function ActivityFeed() {
  const { data: events, isLoading } = useRecentActivity(15);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto max-h-80 pr-2 scrollbar-thin">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : events?.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={event.actor.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {initials(event.actor.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{event.actor.fullName}</span>
                    {' '}
                    <span className="text-muted-foreground">{event.action.replace(/_/g, ' ')}</span>
                    {' '}
                    <span className="font-medium">{event.resource}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRelative(event.createdAt)}
                  </p>
                </div>
              </div>
            ))}
        {!isLoading && !events?.length && (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        )}
      </CardContent>
    </Card>
  );
}
