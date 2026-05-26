"use client";

import React from "react";
import { markAsRead } from "@/services/notificationService";
import { Bell, ShieldCheck, CalendarCheck, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationListProps {
  notifications: any[];
  onUpdate: () => void;
}

/**
 * @fileOverview NotificationList
 * Structured overview of executive network alerts.
 * Uses a robust key strategy to prevent UI glitches during rapid updates.
 */
export default function NotificationList({ notifications, onUpdate }: NotificationListProps) {
  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    onUpdate();
  };

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('booking')) return <CalendarCheck className="w-4 h-4" />;
    if (t.includes('chat') || t.includes('message')) return <MessageSquare className="w-4 h-4" />;
    return <ShieldCheck className="w-4 h-4" />;
  };

  return (
    <div className="divide-y divide-slate-100 bg-white">
      {notifications.map((n: any, index: number) => (
        <div
          key={n.id || n.notificationId || `fallback_${index}`}
          onClick={() => handleMarkRead(n.id || n.notificationId)}
          className={`p-4 flex gap-3 group relative hover:bg-slate-50 transition-colors cursor-pointer ${
            !n.isRead ? "bg-blue-50/30" : "opacity-60"
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            !n.isRead ? "bg-accent/10 text-accent" : "bg-slate-100 text-muted-foreground"
          }`}>
            {getIcon(n.title)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <p className="text-[11px] font-bold text-slate-900 truncate">{n.title}</p>
              <span className="text-[8px] font-bold text-slate-400 uppercase whitespace-nowrap mt-0.5">
                {n.createdAt ? formatDistanceToNow(new Date(n.createdAt)) : 'just now'} ago
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight mt-0.5 italic">{n.message}</p>
          </div>
          {!n.isRead && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
}
