'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ScrollText, Bell, Activity, ShoppingCart, HeadphonesIcon,
  CreditCard, UserPlus, Store, MessageSquare, Users, Shield,
  LogIn, Settings, Zap, X, CheckCheck, ArrowRight, Info, AlertTriangle,
  XCircle, CheckCircle, Filter,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { notificationsApi, type QueueCounts } from '@/lib/api/notifications';
import { useUIStore } from '@/lib/store/uiStore';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { LiveEvent, LiveEventType } from '@/lib/types/realtime.types';

/* ──────────────────────────── Constants ──────────────────────────── */

const QUEUE_LABELS: Record<string, string> = {
  email: 'Email', webhook: 'Webhook', sms: 'SMS', push: 'Push', notification: 'Dispatch',
};

const EVENT_TYPE_CONFIG: Record<LiveEventType, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  auth:        { label: 'Auth',        Icon: LogIn,           color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  security:    { label: 'Security',    Icon: Shield,          color: 'text-red-400',    bg: 'bg-red-500/10' },
  payment:     { label: 'Payment',     Icon: CreditCard,      color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  system:      { label: 'System',      Icon: Settings,        color: 'text-gray-400',   bg: 'bg-gray-500/10' },
  user:        { label: 'User',        Icon: UserPlus,        color: 'text-violet-400', bg: 'bg-violet-500/10' },
  admin:       { label: 'Admin',       Icon: Settings,        color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  oauth:       { label: 'OAuth',       Icon: LogIn,           color: 'text-sky-400',    bg: 'bg-sky-500/10' },
  order:       { label: 'Order',       Icon: ShoppingCart,    color: 'text-orange-400', bg: 'bg-orange-500/10' },
  support:     { label: 'Support',     Icon: HeadphonesIcon,  color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  marketplace: { label: 'Marketplace', Icon: Store,           color: 'text-teal-400',   bg: 'bg-teal-500/10' },
  message:     { label: 'Message',     Icon: MessageSquare,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  community:   { label: 'Community',   Icon: Users,           color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  job:         { label: 'Job',         Icon: Zap,             color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  brand:       { label: 'Brand',       Icon: Store,           color: 'text-lime-400',   bg: 'bg-lime-500/10' },
  cms:         { label: 'CMS',         Icon: ScrollText,      color: 'text-rose-400',   bg: 'bg-rose-500/10' },
};

const SEVERITY_CONFIG = {
  info:     { Icon: Info,          color: 'text-blue-400',  badge: 'secondary' as const },
  warning:  { Icon: AlertTriangle, color: 'text-yellow-400', badge: 'outline' as const },
  error:    { Icon: XCircle,       color: 'text-red-400',   badge: 'destructive' as const },
  critical: { Icon: XCircle,       color: 'text-red-500',   badge: 'destructive' as const },
};

/* ──────────────────────────── Sub-components ──────────────────────── */

function EventRow({ event }: { event: LiveEvent }) {
  const typeCfg = EVENT_TYPE_CONFIG[event.type] ?? { Icon: Zap, color: 'text-gray-400', bg: 'bg-gray-500/10' };
  const sevCfg  = SEVERITY_CONFIG[event.severity];
  const { Icon } = typeCfg;

  const ago = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 5000)    return 'just now';
    if (diff < 60000)   return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const row = (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors group">
      <div className={cn('mt-0.5 shrink-0 p-1.5 rounded-full', typeCfg.bg, typeCfg.color)}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{event.summary ?? event.action.replace(/\./g, ' › ')}</p>
          <Badge variant={sevCfg.badge} className="text-[10px] h-4 px-1.5 shrink-0 capitalize">{event.severity}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {event.userEmail ?? event.userName ?? event.userId ?? '—'}
          {event.ip && <span className="ml-2 opacity-60">{event.ip}</span>}
          {event.country && <span className="ml-1 opacity-50">[{event.country}]</span>}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{ago(event.timestamp)}</p>
      </div>
      {event.href && (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
      )}
    </div>
  );

  return event.href ? <Link href={event.href} className="block">{row}</Link> : row;
}

/* ──────────────────────────── Main page ──────────────────────────── */

export default function NotificationsPage() {
  const { setBreadcrumbs } = useUIStore();
  const events     = useRealtimeStore((s) => s.events);
  const wsState    = useRealtimeStore((s) => s.wsState);
  const clearEvents = useRealtimeStore((s) => s.clearEvents);
  const { notifications, unreadCount, markAllRead, clearEvents: clearNotifs } = useNotificationStore();

  const [activeFilter, setActiveFilter] = useState<LiveEventType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<LiveEvent['severity'] | 'all'>('all');

  useEffect(() => {
    setBreadcrumbs([{ label: 'Notifications' }]);
  }, [setBreadcrumbs]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['notification-queue-stats'],
    queryFn: () => notificationsApi.queues.stats().then((r) => r.data.data),
    refetchInterval: 15_000,
  });

  const queues = stats
    ? (Object.entries(stats) as Array<[string, QueueCounts]>)
    : [];

  // Filtered events (newest first)
  const filtered = useMemo(() => {
    return [...events]
      .reverse()
      .filter((e) => activeFilter === 'all' || e.type === activeFilter)
      .filter((e) => severityFilter === 'all' || e.severity === severityFilter);
  }, [events, activeFilter, severityFilter]);

  const activeTypes = useMemo(() => {
    const seen = new Set<LiveEventType>();
    events.forEach((e) => seen.add(e.type));
    return Array.from(seen);
  }, [events]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notification Center"
        description="Real-time platform activity, channel queue health, and failed delivery management"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/notifications/logs">
                <ScrollText className="mr-2 h-4 w-4" />
                Failed Deliveries
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/notifications/templates">
                <Settings className="mr-2 h-4 w-4" />
                Templates
              </Link>
            </Button>
          </div>
        }
      />

      {/* ── Live Activity Feed ── */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'h-2 w-2 rounded-full shrink-0',
                wsState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
              )} />
              <CardTitle className="text-base">Live Activity Feed</CardTitle>
              <Badge variant="outline" className="text-xs">
                {wsState === 'connected' ? `${events.length} events` : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs gap-1.5">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read ({unreadCount})
                </Button>
              )}
              {events.length > 0 && (
                <Button size="sm" variant="ghost" onClick={clearEvents} className="text-xs gap-1.5 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                  Clear feed
                </Button>
              )}
            </div>
          </div>

          {/* Type filter pills */}
          <div className="flex flex-wrap gap-1.5 pt-3">
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
                activeFilter === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              All
            </button>
            {activeTypes.map((type) => {
              const cfg = EVENT_TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
                    activeFilter === type
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <cfg.Icon className="h-3 w-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Severity filter */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(['all', 'info', 'warning', 'error', 'critical'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors capitalize',
                  severityFilter === sev
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {sev === 'all' ? 'Any severity' : sev}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Activity className="h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">
                {wsState !== 'connected' ? 'Connecting to live stream…' : 'No events match your filter'}
              </p>
              <p className="text-xs opacity-60">
                {wsState === 'connected'
                  ? 'User actions, orders, support tickets, and system events will appear here in real time.'
                  : 'Waiting for the WebSocket connection to the admin service.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              {filtered.map((e) => <EventRow key={e.id} event={e} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Channel Queue Health ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Delivery Queue Health
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
            : queues.map(([key, counts]) => (
                <Card key={key} className={counts.failed > 0 ? 'border-destructive/50' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {QUEUE_LABELS[key] ?? key}
                      {counts.failed > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-4">{counts.failed} failed</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xl font-semibold">{counts.waiting}</p>
                        <p className="text-xs text-muted-foreground">Waiting</p>
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-blue-400">{counts.active}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div>
                        <p className={cn('text-xl font-semibold', counts.failed > 0 ? 'text-destructive' : '')}>
                          {counts.failed}
                        </p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          }
        </div>
      </div>
    </div>
  );
}
