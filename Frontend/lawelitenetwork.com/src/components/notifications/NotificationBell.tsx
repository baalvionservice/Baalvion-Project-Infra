"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLiveNotifications } from "@/hooks/useLiveNotifications";
import { Bell, ShieldCheck, ChevronRight, Inbox, BellRing } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * @fileOverview NotificationBell
 * Executive navbar component for real-time alert monitoring.
 * Enhanced with change-detection animations and auto-mark-as-read logic.
 */
export default function NotificationBell() {
  const { user } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    handleMarkAllRead 
  } = useLiveNotifications(user?.id);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) {
      await markAsRead(n.id || n.notificationId);
    }
    if (n.relatedCaseId) {
      router.push(`/cases/${n.relatedCaseId}`);
    }
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Auto-mark all visible as read when opening the intelligence ledger
      handleMarkAllRead();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative w-10 h-10 rounded-xl glass-panel flex items-center justify-center hover:bg-white/5 transition-all group border-white/10 shadow-lg">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-accent animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
          )}
          
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-accent text-accent-foreground rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-background animate-in zoom-in shadow-xl">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 glass-panel border-white/10 p-0 overflow-hidden mt-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Intelligence Alerts
          </h4>
          {unreadCount > 0 && <span className="text-[9px] text-accent/70 font-bold uppercase tracking-tighter">New Protocol Signal</span>}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
          {loading ? (
            <div className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
              Syncing Ledger...
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => {
              const id = n.id || n.notificationId;
              const isHigh = n.priority === 'high';
              return (
                <div
                  key={id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 flex gap-3 group relative hover:bg-white/5 transition-colors cursor-pointer ${
                    !n.isRead ? "bg-accent/5" : "opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-[11px] font-bold truncate ${isHigh ? 'text-accent' : 'text-white'}`}>
                        {n.title}
                      </p>
                      <span className="text-[8px] font-bold text-muted-foreground/40 uppercase whitespace-nowrap mt-0.5">
                        {n.createdAt ? formatDistanceToNow(new Date(n.createdAt.seconds ? n.createdAt.seconds * 1000 : n.createdAt)) : 'just now'} ago
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 italic">{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(167,139,250,0.5)]" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <Inbox className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground italic">No recent network activity detected.</p>
            </div>
          )}
        </div>

        <div className="p-2 bg-white/5 border-t border-white/5">
          <Link href="/notifications" className="w-full" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full text-[9px] font-bold uppercase tracking-widest hover:bg-white/5 text-muted-foreground hover:text-accent">
              View Full Intelligence Ledger <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
