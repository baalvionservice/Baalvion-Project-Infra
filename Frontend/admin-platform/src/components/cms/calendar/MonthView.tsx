'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
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
  events: CalendarEvent[];
  websiteId: string;
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string, day: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MonthView({
  cursor,
  events,
  websiteId,
  dragId,
  onDragStart,
  onDragEnd,
  onDrop,
}: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor)),
    end: endOfWeek(endOfMonth(cursor)),
  });

  const eventsOn = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.date), day));

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayEvents = eventsOn(day);
          const outside = !isSameMonth(day, cursor);
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
                'min-h-[104px] border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0',
                outside && 'bg-muted/20',
                dragId && 'transition-colors hover:bg-primary/5',
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                    isToday(day) && 'bg-primary font-semibold text-primary-foreground',
                    outside && !isToday(day) && 'text-muted-foreground/50',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 4).map((e) => (
                  <EventChip
                    key={e.id}
                    event={e}
                    href={`/cms/websites/${websiteId}/content/${e.id}`}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {dayEvents.length > 4 && (
                  <p className="px-1 text-[10px] text-muted-foreground">+{dayEvents.length - 4} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
