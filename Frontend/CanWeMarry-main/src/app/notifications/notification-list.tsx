'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, EmptyState, RelativeTime, useToast } from '@/components/ui';
import { me } from '@/lib/api';
import type { Notification } from '@/lib/api/types';
import { cn } from '@/components/ui/cn';
import '@/lib/auth/session';

/**
 * How each kind of notification is labelled.
 *
 * The service sends dotted type strings; this maps the ones it actually emits and falls
 * back to a neutral label for anything new, so an unrecognised type reads as plain rather
 * than as a raw identifier.
 */
const KIND: Record<string, { label: string; tone: 'neutral' | 'accent' | 'ok' | 'warn' }> = {
  'case.participant.invited': { label: 'Invitation', tone: 'accent' },
  'case.participant.granted': { label: 'Invitation', tone: 'ok' },
  'case.participant.declined': { label: 'Invitation', tone: 'neutral' },
  'case.invitation.accepted': { label: 'Invitation', tone: 'ok' },
  'case.invitation.declined': { label: 'Invitation', tone: 'neutral' },
  'case.support.offered': { label: 'Support', tone: 'accent' },
  'case.support.accepted': { label: 'Support', tone: 'ok' },
  'case.support.declined': { label: 'Support', tone: 'neutral' },
  'case.update.posted': { label: 'Case update', tone: 'accent' },
  'moderation.warning': { label: 'Moderation', tone: 'warn' },
};

const labelFor = (type: string) => KIND[type] ?? { label: 'Update', tone: 'neutral' as const };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Groups by day, computed once from the server-rendered list.
 *
 * "Today" and "Yesterday" are relative to the reader's own clock, which is why this happens
 * on the client — the same list would be grouped differently for somebody in another
 * timezone, and a server-side split would put their morning in the wrong bucket.
 */
function group(items: Notification[]) {
  const today = startOfDay(new Date());
  const yesterday = today - 86_400_000;
  const week = today - 6 * 86_400_000;

  const buckets: { key: string; label: string; items: Notification[] }[] = [
    { key: 'today', label: 'Today', items: [] },
    { key: 'yesterday', label: 'Yesterday', items: [] },
    { key: 'week', label: 'Earlier this week', items: [] },
    { key: 'earlier', label: 'Earlier', items: [] },
  ];

  for (const n of items) {
    const day = startOfDay(new Date(n.createdAt));
    if (day >= today) buckets[0]!.items.push(n);
    else if (day >= yesterday) buckets[1]!.items.push(n);
    else if (day >= week) buckets[2]!.items.push(n);
    else buckets[3]!.items.push(n);
  }
  return buckets.filter((b) => b.items.length > 0);
}

export function NotificationList({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);

  const unread = items.filter((n) => !n.readAt).length;
  const groups = useMemo(() => group(items), [items]);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    const result = await me.markRead(id);
    if (!result.ok) {
      // Put it back rather than leave the list disagreeing with the server.
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)));
      return;
    }
    router.refresh();
  }

  async function markAll() {
    setBusy(true);
    const result = await me.markAllRead();
    setBusy(false);
    if (!result.ok) { toast.error(result.error.message); return; }
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    toast.success('All marked as read.');
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing yet"
        description="Invitations, offers of support, replies and moderation notes appear here. Everything reaches you in the app rather than by email — a message about your case arriving in a shared inbox is exactly the disclosure this product exists around."
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-line pb-4">
        <p className="text-sm text-muted" role="status">
          {unread === 0 ? 'All caught up.' : `${unread} unread`}
        </p>
        {unread > 0 && (
          <Button size="sm" variant="ghost" onClick={() => void markAll()} disabled={busy}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`group-${g.key}`}>
            <h2 id={`group-${g.key}`} className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-2">
              {g.label}
            </h2>
            <ul className="space-y-2">
              {g.items.map((n) => {
                const kind = labelFor(n.type);
                const body = (
                  <CardBody className="py-4">
                    <div className="flex items-start gap-3">
                      {/* An unread marker that is not colour alone. */}
                      <span aria-hidden="true" className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', n.readAt ? 'bg-transparent' : 'bg-accent')} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={kind.tone}>{kind.label}</Badge>
                          {!n.readAt && <span className="sr-only">Unread</span>}
                          <span className="ml-auto text-xs text-muted-2"><RelativeTime value={n.createdAt} /></span>
                        </div>
                        <p className={cn('mt-1.5', n.readAt ? 'font-normal' : 'font-medium')}>{n.title}</p>
                        {n.body && <p className="mt-1 text-sm leading-relaxed text-muted">{n.body}</p>}
                      </div>
                    </div>
                  </CardBody>
                );

                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => { if (!n.readAt) void markRead(n.id); }} className="focus-ring block rounded-card">
                        <Card className={cn('transition-shadow hover:shadow-lift', !n.readAt && 'border-accent/30')}>{body}</Card>
                      </Link>
                    ) : (
                      <Card className={cn(!n.readAt && 'border-accent/30')}>{body}</Card>
                    )}
                    {!n.readAt && !n.link && (
                      <button type="button" onClick={() => void markRead(n.id)}
                        className="focus-ring mt-1 rounded-sm px-1 text-xs text-muted hover:text-foreground">
                        Mark as read
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
