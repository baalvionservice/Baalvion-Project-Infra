'use client';

import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  parseISO,
  format,
} from 'date-fns';
import { cn } from '@/lib/utils/cn';
import EventChip from './EventChip';
import type { CalendarEvent } from '@/lib/cms/calendar-events';

interface Props {
  cursor: Date;
  mode: 'week' | 'day';
  events: CalendarEvent[];
  websiteId: string;
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string, day: Date) => void;
}

export default function WeekDayView({
  cursor,
  mode,
  events,
  websiteId,
  dragId,
  onDragStart,
  onDragEnd,
  onDrop,
}: Props) {
  const days =
    mode === 'day'
      ? [cursor]
      : eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });

  const eventsOn = (day: Date) =>
    events
      .filter((e) => isSameDay(parseISO(e.date), day))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  return (
    <div
      className={cn(
        'grid gap-3',
        mode === 'day' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-7',
      )}
    >
      {days.map((day) => {
        const dayEvents = eventsOn(day);
        return (
          <div
            key={day.toISOString()}
            onDragOver={(e) => {
              if (dragId) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain') || dragId;
              if (id) onDrop(id, day);
            }}
            className={cn(
              'flex flex-col rounded-lg border',
              dragId && 'transition-colors hover:border-primary/50',
              mode === 'day' && 'min-h-[400px]',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between border-b px-2.5 py-2',
                isToday(day) && 'bg-primary/5',
              )}
            >
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">{format(day, 'EEE')}</p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isToday(day) && 'text-primary',
                  )}
                >
                  {format(day, mode === 'day' ? 'EEEE, MMMM d' : 'd')}
                </p>
              </div>
              {dayEvents.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums">
                  {dayEvents.length}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-1.5 p-2">
              {dayEvents.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-muted-foreground/60">No content</p>
              ) : (
                dayEvents.map((e) => (
                  <EventChip
                    key={e.id}
                    event={e}
                    href={`/cms/websites/${websiteId}/content/${e.id}`}
                    showTime
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
