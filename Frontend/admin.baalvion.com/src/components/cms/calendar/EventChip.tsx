'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { CalendarClock, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EVENT_TONE, type CalendarEvent } from '@/lib/cms/calendar-events';

interface Props {
  event: CalendarEvent;
  href: string;
  showTime?: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}

export default function EventChip({ event, href, showTime, onDragStart, onDragEnd }: Props) {
  return (
    <div
      draggable={event.draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', event.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(event.id);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'group/chip flex items-center gap-1 rounded border px-1.5 py-1 text-[11px] leading-tight transition-shadow',
        EVENT_TONE[event.status],
        event.draggable ? 'cursor-grab active:cursor-grabbing hover:shadow-sm' : 'cursor-default',
      )}
      title={`${event.title} · ${event.status.replace(/_/g, ' ')}`}
    >
      {event.draggable && (
        <GripVertical className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/chip:opacity-60" />
      )}
      {event.isScheduled && <CalendarClock className="h-3 w-3 shrink-0" />}
      <Link href={href} className="min-w-0 flex-1 truncate hover:underline">
        {showTime && <span className="mr-1 font-medium tabular-nums">{format(parseISO(event.date), 'HH:mm')}</span>}
        {event.title}
      </Link>
    </div>
  );
}
