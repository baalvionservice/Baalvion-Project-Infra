'use client';

import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, ShoppingCart, HeadphonesIcon, CreditCard, UserPlus, Store, MessageSquare, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore, type AppNotification } from '@/lib/store/notificationStore';
import { formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const typeConfig = {
  info: {
    Icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    badge: 'secondary' as const,
  },
  success: {
    Icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    badge: 'secondary' as const,
  },
  warning: {
    Icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    badge: 'outline' as const,
  },
  error: {
    Icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    badge: 'destructive' as const,
  },
};

// Smart icon guessed from the notification title keywords
function SmartIcon({ title, type }: { title: string; type: AppNotification['type'] }) {
  const t = title.toLowerCase();
  if (t.includes('order') || t.includes('purchase'))   return <ShoppingCart className="h-4 w-4" />;
  if (t.includes('support') || t.includes('ticket'))   return <HeadphonesIcon className="h-4 w-4" />;
  if (t.includes('payment') || t.includes('invoice'))  return <CreditCard className="h-4 w-4" />;
  if (t.includes('user') || t.includes('sign') || t.includes('register')) return <UserPlus className="h-4 w-4" />;
  if (t.includes('marketplace') || t.includes('listing')) return <Store className="h-4 w-4" />;
  if (t.includes('message') || t.includes('chat'))     return <MessageSquare className="h-4 w-4" />;
  if (t.includes('community') || t.includes('post'))   return <Users className="h-4 w-4" />;
  const cfg = typeConfig[type];
  return <cfg.Icon className="h-4 w-4" />;
}

function NotificationItem({ n }: { n: AppNotification }) {
  const { markRead } = useNotificationStore();
  const cfg = typeConfig[n.type];

  const inner = (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/40 last:border-0',
        !n.read && 'bg-muted/20',
      )}
      onClick={() => markRead(n.id)}
    >
      <div className={cn('mt-0.5 shrink-0 p-1.5 rounded-full', cfg.bg, cfg.color)}>
        <SmartIcon title={n.title} type={n.type} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm leading-snug', !n.read && 'font-semibold')}>{n.title}</p>
        {n.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>}
        <p className="text-[11px] text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end justify-between">
        {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />}
        {n.href && <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
    </div>
  );

  return n.href ? (
    <Link href={n.href} className="block group">{inner}</Link>
  ) : (
    <div className="group">{inner}</div>
  );
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAllRead } = useNotificationStore();
  const recent = notifications.slice(0, 15);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <DropdownMenuLabel className="px-0 py-0 text-base">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto py-1 text-xs text-blue-400 hover:text-blue-300" onClick={markAllRead}>
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <ScrollArea className="max-h-[440px]">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <Bell className="h-8 w-8 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
              <p className="text-xs opacity-60">New activity from your platform will appear here.</p>
            </div>
          ) : (
            recent.map((n) => <NotificationItem key={n.id} n={n} />)
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/notifications">
                <Button variant="ghost" size="sm" className="w-full text-xs justify-center text-muted-foreground hover:text-foreground">
                  View all notifications
                  <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
