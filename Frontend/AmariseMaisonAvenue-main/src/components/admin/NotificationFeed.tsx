'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NotificationFeedProps {
  maxItems?: number;
  showTitle?: boolean;
}

export function NotificationFeed({ maxItems = 10, showTitle = true }: NotificationFeedProps) {
  const { scopedNotifications, markNotificationRead } = useAppStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-plum" />;
    }
  };

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-plum" />
            <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-gray-900">Institutional Alerts</h3>
          </div>
          <Badge variant="outline" className="text-[8px] uppercase tracking-tighter">
            {scopedNotifications.filter(n => !n.read).length} Unread
          </Badge>
        </div>
      )}

      <div className="divide-y divide-border/40">
        {scopedNotifications.slice(0, maxItems).map((note) => (
          <div 
            key={note.id} 
            className={cn(
              "py-4 group transition-all",
              !note.read ? "opacity-100" : "opacity-60"
            )}
          >
            <div className="flex items-start space-x-4">
              <div className="mt-1">{getIcon(note.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
                    {note.country.toUpperCase()} Hub
                  </span>
                  <span className="text-[8px] text-gray-300 font-mono">
                    {new Date(note.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className={cn(
                  "text-xs leading-relaxed",
                  !note.read ? "font-medium text-gray-900" : "font-light text-gray-500 italic"
                )}>
                  {note.message}
                </p>
                {!note.read && (
                  <button 
                    onClick={() => markNotificationRead(note.id)}
                    className="text-[8px] font-bold uppercase tracking-widest text-plum hover:text-gold mt-2 flex items-center"
                  >
                    <Check className="w-2.5 h-2.5 mr-1" /> Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {scopedNotifications.length === 0 && (
          <div className="py-12 text-center space-y-3 opacity-20">
            <CheckCircle2 className="w-8 h-8 mx-auto" />
            <p className="text-[10px] uppercase font-bold tracking-widest">No active alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
