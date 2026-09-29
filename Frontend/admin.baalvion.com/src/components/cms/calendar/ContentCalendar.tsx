'use client';

import { useMemo, useState } from 'react';
import {
  addMonths,
  addWeeks,
  addDays,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { useContentList, useRescheduleContent } from '@/lib/queries/cms-content.queries';
import { toCalendarEvents, rescheduleToDay, EVENT_TONE } from '@/lib/cms/calendar-events';
import type { ContentItemType } from '@/lib/types/cms-content.types';
import MonthView from './MonthView';
import WeekDayView from './WeekDayView';

interface Props {
  websiteId: string;
  canonicalId: string;
}

type View = 'month' | 'week' | 'day';

const TYPE_FILTERS: { key: ContentItemType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'article', label: 'Articles' },
  { key: 'news', label: 'News' },
  { key: 'page', label: 'Pages' },
  { key: 'post', label: 'Posts' },
];

const LEGEND: { status: keyof typeof EVENT_TONE; label: string }[] = [
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'published', label: 'Published' },
  { status: 'approved', label: 'Approved' },
  { status: 'draft', label: 'Draft' },
];

export default function ContentCalendar({ websiteId, canonicalId }: Props) {
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [typeFilter, setTypeFilter] = useState<ContentItemType | 'all'>('all');
  const [dragId, setDragId] = useState<string | null>(null);

  const { data, isLoading } = useContentList({
    websiteId: canonicalId,
    sortBy: 'updatedAt',
    sortDir: 'desc',
    limit: 200,
  });
  const reschedule = useRescheduleContent();

  const events = useMemo(() => {
    const all = toCalendarEvents(data?.data ?? []);
    return typeFilter === 'all' ? all : all.filter((e) => e.type === typeFilter);
  }, [data, typeFilter]);

  const scheduledCount = events.filter((e) => e.isScheduled).length;

  const move = (dir: -1 | 1) => {
    setCursor((c) =>
      view === 'month' ? addMonths(c, dir) : view === 'week' ? addWeeks(c, dir) : addDays(c, dir),
    );
  };

  const handleDrop = (id: string, day: Date) => {
    setDragId(null);
    const event = events.find((e) => e.id === id);
    if (!event || !event.draggable) return;
    reschedule.mutate({ id, scheduledAt: rescheduleToDay(event.date, day) });
  };

  const rangeLabel =
    view === 'month'
      ? format(cursor, 'MMMM yyyy')
      : view === 'week'
        ? `${format(startOfWeek(cursor), 'MMM d')} – ${format(endOfWeek(cursor), 'MMM d, yyyy')}`
        : format(cursor, 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-4">
      {/* Header / controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-1 text-sm font-semibold">{rangeLabel}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTypeFilter(t.key)}
                className={cn(
                  'rounded px-2 py-1 text-xs font-medium transition-colors',
                  typeFilter === t.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* View switch */}
          <div className="flex items-center gap-1 rounded-md border p-0.5">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                  view === v
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend + summary */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map((l) => (
            <span key={l.status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={cn('h-2.5 w-2.5 rounded-sm border', EVENT_TONE[l.status])} />
              {l.label}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-violet-400" />
          <strong className="text-foreground">{scheduledCount}</strong> scheduled
        </span>
      </div>

      {/* Body */}
      {isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-lg" />
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No scheduled or published content for this view.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Schedule content from the editor or the workflow pipeline to see it here.
            </p>
          </CardContent>
        </Card>
      ) : view === 'month' ? (
        <MonthView
          cursor={cursor}
          events={events}
          websiteId={websiteId}
          dragId={dragId}
          onDragStart={setDragId}
          onDragEnd={() => setDragId(null)}
          onDrop={handleDrop}
        />
      ) : (
        <WeekDayView
          cursor={cursor}
          mode={view}
          events={events}
          websiteId={websiteId}
          dragId={dragId}
          onDragStart={setDragId}
          onDragEnd={() => setDragId(null)}
          onDrop={handleDrop}
        />
      )}

      <p className="text-[11px] text-muted-foreground">
        Tip: drag a draft, approved or scheduled item onto another day to reschedule it.
      </p>
    </div>
  );
}
