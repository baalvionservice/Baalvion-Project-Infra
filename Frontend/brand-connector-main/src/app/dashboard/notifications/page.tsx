
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Zap, 
  Briefcase, 
  Wallet, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  CheckCheck, 
  Trash2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Loader2,
  Target,
  FileText,
  Inbox
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markRead, loading } = useNotificationStore();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTab = activeTab === 'ALL' || (activeTab === 'UNREAD' && !n.read);
      return matchSearch && matchTab;
    });
  }, [notifications, searchQuery, activeTab]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Alert Inbox
          </h1>
          <p className="text-slate-500 font-medium">Track your marketplace events and project updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search alerts..." 
              className="pl-10 h-11 rounded-xl bg-white border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border w-fit">
        <Button variant={activeTab === 'ALL' ? 'outline' : 'ghost'} size="sm" className="rounded-xl px-6" onClick={() => setActiveTab('ALL')}>All</Button>
        <Button variant={activeTab === 'UNREAD' ? 'outline' : 'ghost'} size="sm" className="rounded-xl px-6" onClick={() => setActiveTab('UNREAD')}>Unread</Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Inbox...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((n) => (
            <Card 
              key={n.id} 
              className={cn(
                "border-none shadow-sm rounded-[2rem] overflow-hidden transition-all cursor-pointer group",
                !n.read ? "bg-white ring-1 ring-primary/10" : "bg-slate-50/50 opacity-70"
              )}
              onClick={() => markRead(n.id)}
            >
              <CardContent className="p-6 flex items-start gap-6">
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                  !n.read ? "bg-white border-slate-100" : "bg-slate-100 border-transparent"
                )}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={cn("text-lg", !n.read ? "font-black text-slate-900" : "font-bold text-slate-600")}>{n.title}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{n.message}</p>
                </div>
                {!n.read && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
              <Inbox className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Your inbox is clear</h3>
            <p className="text-sm text-slate-500 max-w-xs">New alerts will appear here when campaign events or payments occur.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircle2(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/><circle cx="12" cy="12" r="10"/></svg> }
function Info(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> }
