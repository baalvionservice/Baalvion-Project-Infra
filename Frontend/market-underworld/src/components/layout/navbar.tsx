"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, MapPin, Bell, Globe, ArrowRight, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIdentity } from '@/context/identity-context';
import { useAuth } from '@/context/auth-context';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { useNotifications } from '@/context/notification-context';

const NAV_ITEMS = [
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'My Cards', path: '/my-cards' },
  { name: 'Live Sessions', path: '/live-sessions' },
  { name: 'Forum', path: '/forum' },
  { name: 'Access', path: '/access' },
  { name: 'About', path: '/about' },
];

export const Navbar = ({ isMarketplace: _isMarketplace }: { isMarketplace?: boolean } = {}) => {
  const pathname = usePathname();
  const { identity, isLoading } = useIdentity();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hide Navbar inside specialized dashboards which have their own navigation
  const isDashboard = pathname.startsWith('/admin') || 
                      pathname.startsWith('/teacher-dashboard') || 
                      pathname.startsWith('/seller-dashboard') || 
                      pathname.startsWith('/student-dashboard');

  if (isDashboard) return null;

  return (
    <nav className="fixed top-0 md:top-8 left-0 right-0 h-16 z-[1000] bg-[#0B0C0F]/80 backdrop-blur-md border-b border-[#252A33]">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 select-none" aria-label="Market Underworld Home">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#39FF14] to-[#3B82F6] flex items-center justify-center text-black font-bold text-[16px]">MU</div>
          <div className="hidden sm:flex items-center text-[16px] tracking-tight leading-none font-display uppercase italic">
            <span className="text-white font-normal">Market</span>
            <span className="text-brand-green font-bold ml-1">Underworld</span>
          </div>
        </Link>

        {/* Desktop & Tablet Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.name}
              href={item.path} 
              className={cn(
                "relative px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-colors min-h-[44px] flex items-center rounded-md hover:bg-white/5",
                pathname === item.path ? "text-brand-green bg-brand-green/5" : "text-text-muted hover:text-white"
              )}
            >
              {item.name}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={cn(
                "relative px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-colors min-h-[44px] flex items-center rounded-md hover:bg-white/5",
                pathname === '/dashboard' ? "text-brand-green bg-brand-green/5" : "text-text-muted hover:text-white"
              )}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className="p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-white/5"
              aria-label="Open Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated && (
              <Link
                href="/wishlist"
                className="p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-white/5"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={cn(
                  "p-2.5 transition-colors rounded-xl border border-white/5 relative",
                  isNotifOpen ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                aria-label="Toggle Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0B0C0F]" />
                )}
              </button>
              <AnimatePresence>
                {isNotifOpen && <NotificationDropdown onClose={() => setIsNotifOpen(false)} />}
              </AnimatePresence>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-brand-surface rounded border border-brand-border">
            {isLoading ? (
              <span className="text-[9px] font-bold text-brand-green uppercase tracking-widest animate-pulse">Scanning...</span>
            ) : (
              <div className="flex items-center gap-3">
                <MapPin className="w-3 h-3 text-brand-green" />
                <span className="text-[9px] font-bold text-white uppercase tracking-widest">{identity?.regionId}: {identity?.countryCode}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all min-h-[44px] min-w-[80px] flex items-center gap-2"
                title={user?.email}
              >
                <span className="w-2 h-2 rounded-full bg-brand-green" />
                Sign Out
              </button>
            ) : (
              <Link href="/auth/signin">
                <button className="px-4 py-2 rounded bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all min-h-[44px] min-w-[80px]">
                  Sign In
                </button>
              </Link>
            )}

            <button 
              className="lg:hidden p-2 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-white/5" 
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-[2001] bg-[#0B0C0F] border-l border-[#252A33] p-8 flex flex-col lg:hidden"
            >
              <div className="flex justify-between items-center mb-16">
                <div className="w-10 h-10 rounded-lg bg-brand-green flex items-center justify-center text-black font-bold">MU</div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-white"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.path} 
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "text-2xl font-bold uppercase italic py-4 border-b border-white/5 flex items-center justify-between group",
                      pathname === item.path ? "text-brand-green" : "text-white"
                    )}
                  >
                    {item.name}
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
                {isAuthenticated && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "text-2xl font-bold uppercase italic py-4 border-b border-white/5 flex items-center justify-between group",
                      pathname === '/dashboard' ? "text-brand-green" : "text-white"
                    )}
                  >
                    Dashboard
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )}
              </div>

              <div className="mt-auto space-y-6">
                <div className="flex items-center gap-4 p-4 bg-brand-surface rounded-xl border border-brand-border">
                  <Globe className="w-5 h-5 text-brand-green" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Current Node</div>
                    <div className="text-sm font-bold text-white">{identity?.region || "Global Hub"}</div>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.3em] text-center">
                  V2.4.0 OPERATIONAL • SECURE
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
