"use client"

import { useState } from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Bell, CheckCheck, Clock, Settings, ArrowRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  type: "ORDER" | "RFQ" | "SHIPMENT" | "FINANCE" | "SYSTEM";
  priority: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export function NotificationPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", type: "ORDER", priority: "HIGH", title: "Payment Released", message: "Escrow funds for ORD-9921 have been released to your account.", time: "2m ago", isRead: false },
    { id: "2", type: "RFQ", priority: "MEDIUM", title: "New Bid Received", message: "Atlas Mining submitted a quote for your Copper RFQ.", time: "45m ago", isRead: false },
    { id: "3", type: "SHIPMENT", priority: "MEDIUM", title: "Port Clearance", message: "M.V. Ocean Carrier has cleared the Port of Durban.", time: "2h ago", isRead: true },
    { id: "4", type: "SYSTEM", priority: "LOW", title: "Platform Update", message: "New 'AI Market Intelligence' tool is now available in your dashboard.", time: "5h ago", isRead: true },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-card flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0 shadow-2xl border-none rounded-2xl overflow-hidden" align="end" sideOffset={12}>
        <div className="bg-primary p-4 text-white">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-sm uppercase tracking-widest">Notifications</h3>
            <Link href="/dashboard/settings?tab=alerts">
              <Settings className="h-4 w-4 opacity-60 hover:opacity-100 transition-opacity" />
            </Link>
          </div>
          <p className="text-[10px] text-primary-foreground/60">You have {unreadCount} unread trade alerts.</p>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="divide-y">
            {notifications.map((note) => (
              <div 
                key={note.id} 
                className={cn(
                  "p-4 hover:bg-slate-50 transition-colors cursor-pointer group",
                  !note.isRead && "bg-primary/5"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "h-2 w-2 rounded-full mt-1.5 shrink-0",
                    note.priority === "HIGH" ? "bg-rose-500" : 
                    note.priority === "MEDIUM" ? "bg-amber-500" : "bg-blue-500"
                  )} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{note.type}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {note.time}</span>
                    </div>
                    <h4 className={cn("text-xs font-bold text-slate-900", !note.isRead && "text-primary")}>{note.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{note.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 bg-slate-50 border-t flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[10px] font-bold text-slate-500 hover:text-primary gap-1.5">
            <CheckCheck className="h-3 w-3" /> Mark all read
          </Button>
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="sm" className="text-[10px] font-bold text-primary gap-1.5 group">
              View All <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
