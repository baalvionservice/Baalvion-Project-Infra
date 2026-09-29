'use client';

import { CalendarClock } from 'lucide-react';
import type { EconomicCalendarEvent } from '@/lib/types/market-data.types';

const BORDER = '#242A33';
const TEXT = '#F5F7FA';
const MUTED = '#9CA3AF';
const ACCENT = '#2D7FF9';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(date: string): string {
  if (date === todayISO()) return 'Today';
  return new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// FRED's release calendar gives real release DATES, not intraday times — CNBC-style
// calendars show times (08:30, 10:00...) that FRED simply doesn't provide, so this
// intentionally shows date + release name only rather than fabricating a time.
export default function EconomicCalendar({ events }: { events: EconomicCalendarEvent[] }) {
  if (events.length === 0) {
    return <p className="py-6 text-center text-xs" style={{ color: MUTED }}>No upcoming releases (FRED key missing or unavailable).</p>;
  }

  const grouped = events.reduce<Record<string, EconomicCalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: ACCENT }}>
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDateLabel(date)}
          </p>
          <div className="space-y-1 border-l pl-3" style={{ borderColor: BORDER }}>
            {items.map((ev) => (
              <p key={`${ev.date}-${ev.releaseName}`} className="text-xs" style={{ color: TEXT }}>{ev.releaseName}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
