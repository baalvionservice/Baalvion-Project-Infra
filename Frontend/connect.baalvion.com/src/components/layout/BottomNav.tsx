'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Wallet,
  User,
  LineChart,
  Users,
  CreditCard,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/use-realtime-data';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { data: notifications } = useNotifications(currentUser?.id);

  const unreadCount = notifications.filter(n => !n.read).length;
  const role = currentUser?.role || 'BRAND';

  const creatorTabs = [
    { name: 'Home', href: '/dashboard/creator', icon: LayoutDashboard },
    { name: 'Discover', href: '/dashboard/creator/campaigns', icon: Search },
    { name: 'Apps', href: '/dashboard/applications', icon: Briefcase, badge: 0 },
    { name: 'Wallet', href: '/dashboard/creator/wallet', icon: Wallet },
    { name: 'Profile', href: '/dashboard/settings', icon: User },
  ];

  const brandTabs = [
    { name: 'Home', href: '/dashboard/brand', icon: LayoutDashboard },
    { name: 'Campaigns', href: '/dashboard/brand/campaigns', icon: Briefcase },
    { name: 'Talent', href: '/dashboard/brand/creators', icon: Users },
    { name: 'Data', href: '/dashboard/brand/analytics', icon: LineChart },
    { name: 'Billing', href: '/dashboard/brand/billing', icon: CreditCard },
  ];

  const tabs = role === 'CREATOR' ? creatorTabs : brandTabs;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]" aria-label="Mobile Navigation Bar">
      <div className="flex items-center justify-between max-w-lg mx-auto relative">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center relative w-16 h-12"
            >
              <div className="relative">
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive ? "text-primary scale-110" : "text-slate-400"
                )} aria-hidden="true" />

                {/* Notification Badge for Home/Apps */}
                {(tab.name === 'Home' && unreadCount > 0) && (
                  <span
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold animate-in zoom-in"
                    aria-label={`${unreadCount} new alerts`}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>

              <span className={cn(
                "text-[10px] font-bold mt-1 tracking-tight transition-all duration-300",
                isActive ? "text-primary opacity-100" : "text-slate-400 opacity-70"
              )}>
                {tab.name}
              </span>

              {/* Animated Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute -top-2 h-1 w-8 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
