import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi, type Notification } from "@/lib/platformClient";

function relativeTime(iso?: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const dot = (type?: string) =>
  type === "critical" || type === "abuse" ? "bg-destructive"
  : type === "warning" || type === "latency" ? "bg-warning"
  : "bg-primary";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-card border-border" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">
            Notifications {unread > 0 && <Badge variant="secondary" className="ml-1 text-xs">{unread}</Badge>}
          </span>
          <Button
            variant="ghost" size="sm" className="text-xs h-7"
            disabled={unread === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <Check className="w-3 h-3 mr-1" />Read all
          </Button>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n: Notification) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 border-b border-border/50 hover:bg-secondary/20 cursor-pointer transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => { if (!n.read) markRead.mutate(n.id); }}
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dot(n.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body ?? n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{relativeTime(n.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
