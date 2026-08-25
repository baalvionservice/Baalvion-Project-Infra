
"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { NexusCard, NexusBadge } from '@/components/ui/nexus-card';
import { NexusButton } from '@/components/ui/nexus-button';
import { Switch } from '@/components/ui/switch';
import {
  Bell,
  Mail,
  Smartphone,
  ShieldCheck,
  Volume2,
  Clock,
  ChevronDown,
  Save,
  Check,
  Video,
  Wallet,
  Package,
  MessageSquare,
  Trophy,
  Info,
  ArrowLeft,
  Languages
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/context/notification-context';

const CATEGORIES = [
  { id: 'class', name: 'Classes & Learning', icon: <Video className="w-5 h-5" />, items: ['Class reminders', 'Teacher updates', 'Recordings ready'] },
  { id: 'payment', name: 'Payments & Wallet', icon: <Wallet className="w-5 h-5" />, items: ['Successful payments', 'Withdrawal status', 'Low balance alerts'] },
  { id: 'order', name: 'Marketplace Orders', icon: <Package className="w-5 h-5" />, items: ['Shipping updates', 'Order confirmation', 'Returns status'] },
  { id: 'message', name: 'Direct Messages', icon: <MessageSquare className="w-5 h-5" />, items: ['New messages', '@mentions', 'Shared files'] },
  { id: 'achievement', name: 'Achievements', icon: <Trophy className="w-5 h-5" />, items: ['Badge unlocks', 'Level updates', 'Leaderboard milestones'] },
  { id: 'system', name: 'System & Security', icon: <ShieldCheck className="w-5 h-5" />, items: ['Login alerts', 'Account changes', 'Maintenance news'] },
];

export default function NotificationSettings() {
  const { addToast } = useNotifications();
  const [expanded, setExpanded] = useState<string | null>('class');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        type: 'success',
        title: 'Settings Saved ✅',
        message: 'Notification preferences updated successfully.',
        duration: 3000
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      <main className="container mx-auto pt-44 pb-32 px-8 max-w-4xl space-y-16">
        <div>
          <Link href="/dashboard">
            <NexusButton variant="ghost" className="text-gray-500 hover:text-white gap-2 -ml-4">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </NexusButton>
          </Link>
        </div>

        <header className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-blue-400 font-bold text-sm uppercase tracking-widest">
              <Bell className="w-4 h-4" /> Global Settings
            </div>
            <div className="flex gap-2 text-xs font-bold uppercase tracking-widest">
              <span className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">Notifications</span>
              <Link href="/settings/language">
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-gray-500 border border-white/10 hover:text-white hover:border-white/20 transition-colors">
                  <Languages className="w-3.5 h-3.5" /> Language
                </span>
              </Link>
            </div>
          </div>
          <h1 className="text-5xl font-bold tracking-tight">Notification Preferences</h1>
          <p className="text-gray-500 text-lg">Control exactly how and when you hear from us.</p>
        </header>

        {/* Delivery Channels */}
        <section className="space-y-8">
          <h3 className="text-xl font-bold">How You're Notified</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'inapp', name: 'In-App', desc: 'Bell icon & Hub', icon: <Bell className="w-5 h-5" />, active: true, locked: true },
              { id: 'push', name: 'Push', desc: 'Browser & Device', icon: <Smartphone className="w-5 h-5" />, active: true, locked: false },
              { id: 'email', name: 'Email', desc: 'Personal Inbox', icon: <Mail className="w-5 h-5" />, active: true, locked: false },
            ].map(channel => (
              <NexusCard key={channel.id} className={cn(
                "p-6 bg-white/[0.02] border-white/5 space-y-6 transition-all",
                channel.active ? "border-blue-500/20" : "opacity-60"
              )}>
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    {channel.icon}
                  </div>
                  <Switch defaultChecked={channel.active} disabled={channel.locked} />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">{channel.name}</h4>
                  <p className="text-xs text-gray-500">{channel.desc}</p>
                </div>
                {channel.locked && (
                  <div className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Core Feature • Locked</div>
                )}
              </NexusCard>
            ))}
          </div>
        </section>

        {/* Do Not Disturb */}
        <section>
          <NexusCard className="p-8 border-amber-500/20 bg-amber-500/[0.02] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-xl">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Quiet Hours (DND)</h3>
                <p className="text-xs text-gray-500">Silence non-urgent notifications during specific times.</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">10:00 PM — 07:00 AM</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Auto-Active Every Day</div>
              </div>
              <Switch defaultChecked />
            </div>
          </NexusCard>
        </section>

        {/* Categories */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold">Category Controls</h3>
          <div className="space-y-4">
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden">
                <button 
                  onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                      {cat.icon}
                    </div>
                    <span className="font-bold text-white">{cat.name}</span>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-gray-600 transition-transform duration-300", expanded === cat.id && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {expanded === cat.id && (
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-white/[0.01] border-t border-white/5"
                    >
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2">
                          <span className="col-span-1">Alert Type</span>
                          <span className="text-center">In-App</span>
                          <span className="text-center">Push</span>
                          <span className="text-center">Email</span>
                        </div>
                        <div className="space-y-4">
                          {cat.items.map(item => (
                            <div key={item} className="grid grid-cols-4 items-center px-2">
                              <span className="text-sm font-medium text-gray-400">{item}</span>
                              <div className="flex justify-center"><Switch defaultChecked /></div>
                              <div className="flex justify-center"><Switch defaultChecked /></div>
                              <div className="flex justify-center"><Switch /></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Master Actions */}
        <div className="pt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-sm font-bold text-white">Save your configuration</p>
            <p className="text-xs text-gray-500 font-medium">Changes take effect instantly across all connected nodes.</p>
          </div>
          <NexusButton 
            onClick={handleSave} 
            size="lg" 
            className="w-full sm:w-auto px-16 h-16 nexus-gradient-bg font-bold shadow-2xl shadow-blue-500/20"
            isLoading={isSaving}
          >
            <Save className="w-5 h-5 mr-2" /> Save Preferences
          </NexusButton>
        </div>
      </main>

      <Footer />
    </div>
  );
}
