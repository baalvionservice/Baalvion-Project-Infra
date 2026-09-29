
"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Notification } from '@/context/notification-context';
import { Bell, CheckCircle2, Settings, ExternalLink, Video, Wallet, Package, MessageSquare, Trophy, Info } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDropdown = ({ onClose }: { onClose: () => void }) => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const recent = notifications.slice(0, 8);

  const getIcon = (type: string) => {
    switch (type) {
      case 'class': return <Video className="w-4 h-4 text-red-400" />;
      case 'payment': return <Wallet className="w-4 h-4 text-emerald-400" />;
      case 'order': return <Package className="w-4 h-4 text-amber-400" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'achievement': return <Trophy className="w-4 h-4 text-amber-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full mt-4 right-0 w-[400px] bg-[#13131E] border border-white/10 rounded-2xl shadow-3xl z-[300] overflow-hidden"
    >
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-gray-400" />
          <h3 className="font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} unread</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            Mark all read
          </button>
          <Link href="/settings/notifications" onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="max-h-[420px] overflow-y-auto no-scrollbar py-2">
        {recent.length > 0 ? (
          recent.map((n) => (
            <Link 
              key={n.id} 
              href={n.actionUrl || '#'} 
              onClick={() => { markAsRead(n.id); onClose(); }}
              className={cn(
                "flex gap-4 p-4 hover:bg-white/5 transition-all group relative",
                !n.read && "bg-white/[0.02]"
              )}
            >
              {!n.read && (
                <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-500 rounded-r-full" />
              )}
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className={cn("text-sm font-bold truncate", n.read ? "text-gray-400" : "text-white")}>{n.title}</h4>
                  <span className="text-[9px] font-bold text-gray-600 uppercase shrink-0 mt-1">
                    {formatDistanceToNow(n.timestamp, { addSuffix: true }).replace('about ', '')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{n.body}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <Bell className="w-12 h-12 text-gray-800 mx-auto" />
            <div>
              <p className="font-bold text-gray-500">You're all caught up! ✅</p>
              <p className="text-xs text-gray-600">No new notifications</p>
            </div>
          </div>
        )}
      </div>

      <Link 
        href="/notifications" 
        onClick={onClose}
        className="block p-4 text-center text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] bg-white/[0.02] border-t border-white/5 hover:bg-white/5 transition-all"
      >
        View All Notifications ↗
      </Link>
    </motion.div>
  );
};
