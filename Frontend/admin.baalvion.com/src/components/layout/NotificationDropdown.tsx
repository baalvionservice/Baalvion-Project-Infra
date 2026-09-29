'use client';

import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore, type AppNotification } from '@/lib/store/notificationStore';
import { formatRelative } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

function NotificationItem({ n }: { n: AppNotification }) {
  const { markRead } = useNotificationStore();
  const Icon = typeIcons[n.type];

  return (
    <div
      className={cn(
        'flex gap-3 p-3 cursor-pointer hover:bg-muted/50 rounded-md transition-colors',
        !n.read && 'bg-muted/30',
      )}
      onClick={() => markRead(n.id)}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', typeColors[n.type])} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', !n.read && 'font-medium')}>{n.title}</p>
        {n.body && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>}
        <p className="text-xs text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
      </div>
    </div>
  );
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAllRead } = useNotificationStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="px-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={markAllRead}>
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((n) => (
                <NotificationItem key={n.id} n={n} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
