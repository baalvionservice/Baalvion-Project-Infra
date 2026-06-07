import { parseISO } from 'date-fns';
import type { ContentItem, ContentItemType, ContentWorkflowStatus } from '@/lib/types/cms-content.types';

export interface CalendarEvent {
  id: string;
  title: string;
  type: ContentItemType;
  status: ContentWorkflowStatus;
  date: string; // ISO — scheduledAt for scheduled items, else publishedAt
  isScheduled: boolean;
  draggable: boolean; // only un-published items can be (re)scheduled by dragging
}

// Status → tone for event chips (semantic, matches the workflow palette).
export const EVENT_TONE: Record<ContentWorkflowStatus, string> = {
  scheduled: 'border-violet-500/40 bg-violet-500/15 text-violet-300',
  published: 'border-green-500/40 bg-green-500/15 text-green-300',
  approved: 'border-blue-500/40 bg-blue-500/15 text-blue-300',
  draft: 'border-zinc-500/40 bg-zinc-500/15 text-zinc-300',
  pending_review: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  changes_requested: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  archived: 'border-zinc-600/40 bg-zinc-600/15 text-zinc-400',
};

const DRAGGABLE_STATUSES: ContentWorkflowStatus[] = ['scheduled', 'draft', 'approved'];

export function toCalendarEvents(items: ContentItem[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const item of items) {
    const date = item.scheduledAt ?? item.publishedAt;
    if (!date) continue;
    events.push({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      date,
      isScheduled: item.status === 'scheduled',
      draggable: DRAGGABLE_STATUSES.includes(item.status),
    });
  }
  return events;
}

// Build the ISO timestamp for a rescheduled drop: keep the original clock time but
// move it onto the target calendar day.
export function rescheduleToDay(originalIso: string, targetDay: Date): string {
  const original = parseISO(originalIso);
  const next = new Date(targetDay);
  next.setHours(original.getHours(), original.getMinutes(), 0, 0);
  return next.toISOString();
}
