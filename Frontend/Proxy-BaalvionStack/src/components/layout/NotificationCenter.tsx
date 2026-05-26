import { useState, useEffect } from "react";
import { Bell, X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initialNotifications, Notification } from "@/data/notificationsData";

const severityIcon = (s: string) => s === "critical" ? "bg-destructive" : s === "warning" ? "bg-warning" : "bg-primary";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  // Simulate real-time notification every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const types: Notification["type"][] = ["bandwidth", "proxy", "latency", "abuse", "system"];
      const messages = [
        { title: "Usage Spike Detected", message: "Bandwidth consumption increased 40% in the last hour." },
        { title: "New Region Available", message: "South Korea proxy pool now available." },
        { title: "Maintenance Scheduled", message: "Planned maintenance window: Sunday 02:00-04:00 UTC." },
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      const newNotif: Notification = {
        id: `n-${Date.now()}`,
        type: types[Math.floor(Math.random() * types.length)],
        title: msg.title,
        message: msg.message,
        time: "Just now",
        read: false,
        severity: "info",
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 20));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll = () => setNotifications([]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-card border-border" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Notifications {unread > 0 && <Badge variant="secondary" className="ml-1 text-xs">{unread}</Badge>}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}><Check className="w-3 h-3 mr-1" />Read all</Button>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAll}><Trash2 className="w-3 h-3 mr-1" />Clear</Button>
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-3 border-b border-border/50 hover:bg-secondary/20 cursor-pointer transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => markRead(n.id)}
              >
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${severityIcon(n.severity)}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? "font-medium text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
