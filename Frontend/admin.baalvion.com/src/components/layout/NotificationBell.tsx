'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import LiveEventFeed from '@/components/realtime/LiveEventFeed';
import { cn } from '@/lib/utils/cn';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const events = useRealtimeStore((s) => s.events);
  const clearEvents = useRealtimeStore((s) => s.clearEvents);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync unread count with new events when closed
  useEffect(() => {
    if (!isOpen) {
      setUnreadCount(events.length);
    }
  }, [events.length, isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[80vh] bg-[#12141A] border border-gray-800 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">Activity Center</h3>
            <button 
              onClick={() => { clearEvents(); setUnreadCount(0); }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Clear All
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto">
            <LiveEventFeed maxHeight={400} />
          </div>
        </div>
      )}
    </div>
  );
}
