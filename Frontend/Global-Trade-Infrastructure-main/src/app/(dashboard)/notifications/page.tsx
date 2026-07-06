'use client';

/**
 * @file notifications/page.tsx
 * @description Full notification inbox — the "View All Notifications" destination
 * from the header bell. Backed by the same corrected communication-service used
 * by the header dropdown, so both stay consistent.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getNotifications, markNotificationAsRead, markAllNotificationsRead, Notification,
} from '@/services/communication-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => getNotifications().then((n) => setNotifications(Array.isArray(n) ? n : []));

  useEffect(() => {
    let cancelled = false;
    getNotifications()
      .then((n) => { if (!cancelled) setNotifications(Array.isArray(n) ? n : []); })
      .catch(() => { if (!cancelled) setNotifications([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await load();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Inbox</p>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Notifications</h1>
          <p className="text-muted-foreground font-medium italic">Activity across RFQs, orders, tasks, and support tickets.</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAll} disabled={markingAll} variant="outline" className="font-black uppercase tracking-widest">
            {markingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />} Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-widest">All Notifications</CardTitle>
          <CardDescription>{unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up.'}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6">
              <Bell className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-sm font-bold text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const content = (
                  <div
                    className={cn(
                      'flex items-start justify-between gap-4 p-5 hover:bg-muted/30 transition-colors',
                      !n.isRead && 'bg-muted/20'
                    )}
                    onClick={() => !n.isRead && handleRead(n.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        <p className={cn('text-sm font-bold', !n.isRead ? 'text-foreground' : 'text-muted-foreground')}>{n.title}</p>
                        <Badge variant="outline" className="text-[9px] font-black uppercase">{n.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} className="block cursor-pointer">{content}</Link>
                ) : (
                  <div key={n.id} className="cursor-pointer">{content}</div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
