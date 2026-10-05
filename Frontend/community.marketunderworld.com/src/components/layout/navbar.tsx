"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, MapPin, Bell, Globe, ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIdentity } from '@/context/identity-context';
import { useAuth } from '@/context/auth-context';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { useNotifications } from '@/context/notification-context';
import { useScaryTransition } from '@/components/layout/scary-transition-provider';
import { useCart } from '@/context/cart-context';

const NAV_ITEMS = [
  { name: 'Clubs', path: '/clubs' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Live Sessions', path: '/live-sessions' },
  { name: 'Forum', path: '/forum' },
  { name: 'Locals', path: '/locals' },
];

const DRAWER_EXPLORE = [
  { name: 'Clubs', path: '/clubs' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Locals', path: '/locals' },
  { name: 'Education', path: '/education' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Shop', path: '/shop' },
  { name: 'Live Sessions', path: '/live-sessions' },
  { name: 'Forum', path: '/forum' },
  { name: 'Bug Bounty', path: '/bounty' },
];

export const Navbar = ({ isMarketplace: _isMarketplace }: { isMarketplace?: boolean } = {}) => {
  const pathname = usePathname();
  const { identity, isLoading } = useIdentity();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { navigateWithScare } = useScaryTransition();
  const { itemCount } = useCart();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleScaryClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigateWithScare(path);
  };

  // Close the drawer on navigation or Escape, and stop the page scrolling behind it.
  useEffect(() => { setIsMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [isMobileOpen]);

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

  // Adjust page padding for navbar on mobile (top-8 = 32px ticker + 14px nav = 56px total)
  // Hide Navbar inside specialized dashboards which have their own navigation
  const isDashboard = pathname.startsWith('/admin') || 
                      pathname.startsWith('/teacher-dashboard') || 
                      pathname.startsWith('/seller-dashboard') || 
                      pathname.startsWith('/student-dashboard');

  if (isDashboard) return null;

  return (
    <nav className="fixed top-0 md:top-8 left-0 right-0 h-14 z-[1000]">
      {/* The blur lives on its own layer: backdrop-filter on <nav> itself would make it the containing
          block for the fixed mobile drawer below, shrinking the whole menu into the 56px bar. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#0B0C0F]/90 backdrop-blur-md border-b border-[#252A33]" />
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 select-none" aria-label="Baalvion Home">
          <div className="w-8 h-8 rounded overflow-hidden border border-white/10 flex items-center justify-center bg-black flex-shrink-0">
            <img src="/logo.jpg" alt="Baalvion Logo" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:flex items-center text-[15px] tracking-widest leading-none font-display uppercase font-bold text-white">
            BAALVION
          </div>
        </Link>

        {/* Desktop & Tablet Nav */}
        <div className="hidden xl:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <a 
              key={item.name}
              href={item.path} 
              onClick={(e) => handleScaryClick(e, item.path)}
              className={cn(
                "relative px-4 py-2 text-[12px] font-bold uppercase tracking-widest transition-colors min-h-[44px] flex items-center rounded-md hover:bg-white/5 cursor-pointer",
                pathname === item.path ? "text-brand-green bg-brand-green/5" : "text-text-muted hover:text-white"
              )}
            >
              {item.name}
            </a>
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
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
            className="xl:hidden p-2 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-white/5"
            aria-label="Open Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <div className="hidden xl:flex items-center gap-2">
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

          <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-brand-surface rounded border border-brand-border">
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
              <button
                onClick={() => {
                  if (window.location.pathname === '/') {
                    document.getElementById('terminal-auth')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="px-4 py-2 rounded text-[11px] font-bold uppercase tracking-widest transition-all min-h-[44px] min-w-[80px] border"
                style={{ background: 'rgba(180,0,0,0.15)', borderColor: 'rgba(180,0,0,0.4)', color: '#cc4444' }}
              >
                ⚠ ENTER
              </button>
            )}

            <Link href="/checkout" className="relative p-2 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-white/5 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-fuchsia-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <button 
              className="xl:hidden p-2 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-white/5" 
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Drawer: portalled to <body> so no ancestor stacking context (the nav, the ticker)
          can sit over it. */}
      {mounted && createPortal(
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm xl:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-xs sm:max-w-sm z-[2001] font-sans bg-[#0B0C0F] border-l border-[#252A33] p-6 flex flex-col xl:hidden overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded overflow-hidden border border-white/10 flex-shrink-0">
                    <img src="/logo.jpg" alt="Baalvion Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-white">BAALVION</span>
                </div>
                <button 
                  onClick={() => setIsMobileOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-white"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 mb-2">Explore</p>
              <div className="flex flex-col">
                {DRAWER_EXPLORE.map((item) => (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={(e) => {
                      setIsMobileOpen(false);
                      handleScaryClick(e, item.path);
                    }}
                    className={cn(
                      "text-lg font-bold uppercase tracking-wide py-3.5 min-h-[48px] border-b border-white/5 flex items-center justify-between cursor-pointer",
                      pathname === item.path || pathname.startsWith(item.path + '/') ? "text-brand-green" : "text-white"
                    )}
                  >
                    {item.name}
                    <ArrowRight className="w-4 h-4 opacity-40" />
                  </a>
                ))}
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 mt-8 mb-2">Account</p>
              <div className="flex flex-col">
                {(isAuthenticated
                  ? [
                      { name: 'Dashboard', path: '/dashboard' },
                      { name: 'Notifications', path: '/notifications' },
                      { name: 'Wishlist', path: '/wishlist' },
                      { name: 'Help & Support', path: '/support' },
                    ]
                  : [
                      { name: 'Sign In', path: '/auth/signin' },
                      { name: 'Create Account', path: '/auth/registration' },
                      { name: 'Help & Support', path: '/support' },
                    ]
                ).map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className="text-base font-semibold py-3.5 min-h-[48px] border-b border-white/5 flex items-center justify-between text-gray-200"
                  >
                    {item.name}
                    <ArrowRight className="w-4 h-4 opacity-40" />
                  </Link>
                ))}
                {isAuthenticated && (
                  <button
                    onClick={() => { setIsMobileOpen(false); logout(); }}
                    className="text-base font-semibold py-3.5 min-h-[48px] text-left text-red-400"
                  >
                    Sign Out
                  </button>
                )}
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-brand-surface rounded-xl border border-brand-border">
                  <Globe className="w-5 h-5 text-brand-green" />
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Current Node</div>
                    <div className="text-sm font-bold text-white">{identity?.region || "Global Hub"}</div>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.3em] text-center">
                  Market Underworld
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
        , document.body)}
    </nav>
  );
};
