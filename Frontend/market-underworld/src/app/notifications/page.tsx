
"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card';
import { NexusButton } from '@/components/ui/nexus-button';
import { useNotifications, Notification } from '@/context/notification-context';
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  Settings, 
  Search, 
  Filter, 
  Video, 
  Wallet, 
  Package, 
  MessageSquare, 
  Trophy, 
  Info,
  ChevronRight,
  MoreVertical,
  X,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, clearAll, addToast, addNotification } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const filtered = notifications.filter(n => {
    const matchesFilter = filter === 'all' || n.type === filter;
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selected = notifications.find(n => n.id === selectedId);

  const getIcon = (type: string, large = false) => {
    const size = large ? 24 : 18;
    switch (type) {
      case 'class': return <Video size={size} className="text-red-400" />;
      case 'payment': return <Wallet size={size} className="text-emerald-400" />;
      case 'order': return <Package size={size} className="text-amber-400" />;
      case 'message': return <MessageSquare size={size} className="text-purple-400" />;
      case 'achievement': return <Trophy size={size} className="text-amber-400" />;
      default: return <Info size={size} className="text-blue-400" />;
    }
  };

  const startDemo = () => {
    setIsDemoMode(true);
    addToast({
      type: 'class',
      title: 'Demo Started!',
      message: 'Watch as mock notifications arrive.',
      duration: 3000
    });

    setTimeout(() => {
      addToast({
        type: 'payment',
        title: '0.02 ETH Received ✅',
        message: 'From: Priya Sharma (class payment)',
        duration: 5000
      });
      addNotification({
        type: 'payment',
        title: '0.02 ETH Payment Received',
        body: 'Blockchain confirmation successful. Transaction verified.',
        source: { name: 'NEXUS Wallet' }
      });
    }, 2000);

    setTimeout(() => {
      addToast({
        type: 'achievement',
        title: 'Achievement Unlocked! 🎉',
        message: 'Crypto Whale — 84% complete. +50 XP earned.',
        duration: 5000
      });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      <main className="container mx-auto pt-44 pb-32 px-8 max-w-7xl">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight nexus-gradient-text">Notification Center</h1>
            <p className="text-gray-500 text-lg">Your activity, updates and alerts — all in one place.</p>
          </div>
          <div className="flex gap-3">
            <NexusButton variant="outline" size="sm" onClick={startDemo} className={cn("border-white/10", isDemoMode && "text-emerald-400")}>
              <Play className="w-4 h-4 mr-2" /> Live Demo Mode
            </NexusButton>
            <Link href="/settings/notifications">
              <NexusButton variant="outline" size="sm" className="border-white/10">
                <Settings className="w-4 h-4 mr-2" /> Preferences
              </NexusButton>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* List Panel */}
          <div className="lg:col-span-8 space-y-8">
            <NexusCard className="p-6 bg-white/[0.02] border-white/5 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
                {['all', 'class', 'payment', 'order', 'message', 'achievement'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                      filter === cat ? "bg-white/10 text-white shadow-lg shadow-white/5" : "text-gray-500 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..." 
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-sm outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                <button onClick={markAllAsRead} className="p-2 text-gray-500 hover:text-white transition-colors" title="Mark all as read">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <button onClick={clearAll} className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Clear all read">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </NexusCard>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => { setSelectedId(n.id); markAsRead(n.id); }}
                    className={cn(
                      "p-5 rounded-2xl border transition-all cursor-pointer group relative flex gap-5",
                      selectedId === n.id ? "bg-[#1A1A2E] border-blue-500/30 shadow-2xl" : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03]",
                      !n.read && "bg-white/[0.03]"
                    )}
                  >
                    {!n.read && (
                      <div className="absolute left-0 top-5 bottom-5 w-1 bg-blue-500 rounded-r-full" />
                    )}
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                      !n.read ? "bg-white/5 border-white/10" : "bg-transparent border-white/5 opacity-50"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className={cn("text-sm font-bold", !n.read ? "text-white" : "text-gray-400")}>{n.title}</h4>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter shrink-0 mt-1">
                          {format(n.timestamp, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{n.body}</p>
                      {n.actionLabel && !selectedId && (
                        <div className="pt-2">
                          <NexusBadge variant="info" className="text-[8px] bg-blue-500/10 text-blue-400 border-none">{n.actionLabel}</NexusBadge>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="py-32 text-center space-y-6">
                  <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/10">
                    <Bell className="w-10 h-10 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-500">No notifications found</h3>
                    <p className="text-sm text-gray-600">Try adjusting your filters or search query.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <aside className="lg:col-span-4 h-fit sticky top-44">
            <NexusCard className="p-8 border-white/10 bg-[#0D0D14]/60 backdrop-blur-2xl shadow-3xl min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col h-full space-y-10"
                  >
                    <header className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-xl">
                        {getIcon(selected.type, true)}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:text-white transition-colors border border-white/10 rounded-xl bg-white/5"><MoreVertical size={18} /></button>
                        <button onClick={() => setSelectedId(null)} className="p-2 text-gray-500 hover:text-white transition-colors border border-white/10 rounded-xl bg-white/5"><X size={18} /></button>
                      </div>
                    </header>

                    <div className="space-y-4">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">{selected.type} Update</div>
                      <h2 className="text-2xl font-bold text-white leading-tight">{selected.title}</h2>
                      <div className="text-sm text-gray-400 font-medium leading-relaxed">
                        {selected.body}
                      </div>
                    </div>

                    {selected.source && (
                      <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-400">
                          {selected.source.avatar ? <img src={selected.source.avatar} className="w-full h-full rounded-full object-cover" /> : selected.source.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{selected.source.name}</div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selected.source.role || 'Service'}</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto space-y-4">
                      <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center border-t border-white/5 pt-6">
                        Received {format(selected.timestamp, 'MMMM d, yyyy • HH:mm')}
                      </div>
                      {selected.actionUrl && (
                        <Link href={selected.actionUrl}>
                          <NexusButton className="w-full h-14 nexus-gradient-bg font-bold shadow-2xl">
                            {selected.actionLabel || 'View Details'} <ChevronRight className="w-4 h-4 ml-2" />
                          </NexusButton>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-20">
                    <div className="relative">
                      <Bell className="w-16 h-16 text-gray-800" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/20 rounded-full animate-ping" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-500">Select a notification</h3>
                      <p className="text-sm text-gray-600 max-w-[200px] mx-auto mt-2">Click any notification to see the full details and actions.</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </NexusCard>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
