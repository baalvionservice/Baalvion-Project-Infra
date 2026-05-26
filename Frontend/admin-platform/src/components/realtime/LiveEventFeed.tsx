'use client';

import { useEffect, useRef } from 'react';
import { ShieldAlert, LogIn, LogOut, Key, CreditCard, Settings, Zap, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import type { LiveEvent } from '@/lib/types/realtime.types';
import { cn } from '@/lib/utils/cn';

const typeIcon = (type: LiveEvent['type']) => {
  switch (type) {
    case 'auth':     return LogIn;
    case 'security': return ShieldAlert;
    case 'payment':  return CreditCard;
    case 'oauth':    return Key;
    case 'admin':    return Settings;
    case 'user':     return User;
    default:         return Zap;
  }
};

const severityStyles: Record<LiveEvent['severity'], string> = {
  info:     'text-blue-400',
  warning:  'text-yellow-400',
  error:    'text-red-400',
  critical: 'text-red-500 font-semibold',
};

const severityBadge: Record<LiveEvent['severity'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  info:     'secondary',
  warning:  'outline',
  error:    'destructive',
  critical: 'destructive',
};

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 5000)   return 'just now';
  if (diff < 60000)  return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}

interface EventRowProps { event: LiveEvent; }

function EventRow({ event }: EventRowProps) {
  const Icon = typeIcon(event.type);
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-border/40 last:border-0 group">
      <div className={cn('mt-0.5 shrink-0', severityStyles[event.severity])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight truncate">
          {event.action.replace(/\./g, ' › ')}
        </p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {event.userEmail ?? event.userId ?? '—'}
          {event.ip && <span className="ml-1.5 opacity-60">{event.ip}</span>}
          {event.country && <span className="ml-1 opacity-50">[{event.country}]</span>}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className="text-[10px] text-muted-foreground">{ago(event.timestamp)}</span>
        {event.severity !== 'info' && (
          <Badge variant={severityBadge[event.severity]} className="text-[9px] h-3.5 px-1 py-0">
            {event.severity}
          </Badge>
        )}
      </div>
    </div>
  );
}

interface Props {
  maxHeight?: number;
  className?: string;
}

export default function LiveEventFeed({ maxHeight = 320, className }: Props) {
  const events = useRealtimeStore((s) => s.events);
  const wsState = useRealtimeStore((s) => s.wsState);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [events.length]);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          'h-1.5 w-1.5 rounded-full shrink-0',
          wsState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'
        )} />
        <span className="text-xs text-muted-foreground">
          {wsState === 'connected' ? 'Live stream' : 'Stream offline'}
          {events.length > 0 && ` · ${events.length} events`}
        </span>
      </div>
      <div
        ref={ref}
        style={{ maxHeight }}
        className="overflow-y-auto"
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Zap className="h-6 w-6 opacity-30" />
            <p className="text-xs">Waiting for events…</p>
          </div>
        ) : (
          [...events].reverse().map((e) => <EventRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
