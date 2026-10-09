"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, MapPin, Bell, Globe, ArrowRight, Heart, ShoppingCart, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIdentity } from '@/context/identity-context';
import { useAuth } from '@/context/auth-context';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';
import { useNotifications } from '@/context/notification-context';
import { useScaryTransition } from '@/components/layout/scary-transition-provider';
import { useCart } from '@/context/cart-context';

const NAV_ITEMS = [
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Clubs', path: '/clubs' },
  { name: 'Forum', path: '/forum' },
  { name: 'Live Sessions', path: '/live-sessions' },
  { name: 'Calendar', path: '/calendar' },
  { name: 'Locals', path: '/locals' },
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
  const notifRef = useRef<HTMLDivElement>(null);

  const handleScaryClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setIsMobileOpen(false);
    navigateWithScare(path);
  };

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  // Hide Navbar inside specialized dashboards which have their own navigation
  const isDashboard = pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher-dashboard') ||
    pathname.startsWith('/seller-dashboard') ||
    pathname.startsWith('/student-dashboard');

  if (isDashboard) return null;

  return (
    <>
      <nav className="fixed top-8 left-0 right-0 h-14 z-[1000] bg-[#0B0C0F]/95 backdrop-blur-md border-b border-[#252A33]">
        <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between px-4 sm:px-6">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 select-none flex-shrink-0" aria-label="Home">
            <div className="w-8 h-8 rounded overflow-hidden border border-white/10 flex items-center justify-center bg-black flex-shrink-0">
              <img src="/logo.jpg" alt="Hell Road" className="w-full h-full object-cover" />
            </div>
            <span className="text-[15px] tracking-widest leading-none font-display uppercase font-bold text-white">
              HELL ROAD
            </span>
          </Link>

          {/* ── Desktop Nav Links (lg+) ── */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center px-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.path}
                onClick={(e) => handleScaryClick(e, item.path)}
                className={cn(
                  "relative px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors min-h-[44px] flex items-center rounded-md hover:bg-white/5 cursor-pointer whitespace-nowrap",
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
                  "relative px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors min-h-[44px] flex items-center rounded-md hover:bg-white/5 whitespace-nowrap",
                  pathname === '/dashboard' ? "text-brand-green bg-brand-green/5" : "text-text-muted hover:text-white"
                )}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

            {/* Search — desktop only */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
              className="hidden md:flex p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-white/5"
              aria-label="Open Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist — desktop only */}
            {isAuthenticated && (
              <Link
                href="/wishlist"
                className="hidden md:flex p-2.5 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-white/5"
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4" />
              </Link>
            )}

            {/* Notifications — desktop only */}
            <div className="hidden md:block relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={cn(
                  "p-2.5 transition-colors rounded-xl border border-white/5 relative",
                  isNotifOpen ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                aria-label="Toggle Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0B0C0F]" />
                )}
              </button>
              <AnimatePresence>
                {isNotifOpen && <NotificationDropdown onClose={() => setIsNotifOpen(false)} />}
              </AnimatePresence>
            </div>

            {/* Cart — always visible */}
            <Link
              href="/checkout"
              className="relative p-2.5 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/5 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-fuchsia-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Sign In / Out — always visible */}
            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all min-h-[40px] items-center gap-2"
                title={user?.email}
              >
                <span className="w-2 h-2 rounded-full bg-brand-green" />
                <span className="hidden sm:inline">Sign Out</span>
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
                className="px-3 sm:px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all min-h-[40px] border"
                style={{ background: 'rgba(180,0,0,0.15)', borderColor: 'rgba(180,0,0,0.4)', color: '#cc4444' }}
              >
                Sign In
              </button>
            )}

            {/* Hamburger — visible below lg */}
            <button
              className="lg:hidden p-2.5 text-text-muted min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-colors ml-1"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile/Tablet Drawer ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[min(320px,90vw)] z-[2001] bg-[#0B0C0F] border-l border-[#252A33] flex flex-col lg:hidden"
            >
              {/* Drawer header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-[#252A33]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded overflow-hidden border border-white/10 flex-shrink-0">
                    <img src="/logo.jpg" alt="Hell Road" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-white">HELL ROAD</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 text-text-muted hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer nav links */}
              <nav className="flex-1 overflow-y-auto px-4 py-4">
                <div className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <a
                      key={item.name}
                      href={item.path}
                      onClick={(e) => handleScaryClick(e, item.path)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors group",
                        pathname === item.path
                          ? "text-brand-green bg-brand-green/10 border border-brand-green/20"
                          : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                      )}
                    >
                      {item.name}
                      <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                  {isAuthenticated && (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors group border",
                        pathname === '/dashboard'
                          ? "text-brand-green bg-brand-green/10 border-brand-green/20"
                          : "text-white/70 hover:text-white hover:bg-white/5 border-transparent"
                      )}
                    >
                      Dashboard
                      <ArrowRight className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                </div>

                {/* Mobile search */}
                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    window.dispatchEvent(new CustomEvent('open-global-search'));
                  }}
                  className="w-full mt-4 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                >
                  <Search className="w-4 h-4" />
                  Search everything...
                </button>

                {/* Mobile notifications */}
                <Link
                  href="/notifications"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full mt-2 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-auto w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated && (
                  <Link
                    href="/wishlist"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full mt-2 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    <Heart className="w-4 h-4" />
                    Wishlist
                  </Link>
                )}
              </nav>

              {/* Drawer footer */}
              <div className="px-4 py-5 border-t border-[#252A33] space-y-3">
                {identity && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-white/3 rounded-xl border border-white/8">
                    <Globe className="w-4 h-4 text-brand-green flex-shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Region</div>
                      <div className="text-sm font-bold text-white">{identity.region || 'Global Hub'}</div>
                    </div>
                  </div>
                )}
                {isAuthenticated ? (
                  <button
                    onClick={() => { setIsMobileOpen(false); logout(); }}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2 justify-center"
                  >
                    <span className="w-2 h-2 rounded-full bg-brand-green" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      window.location.href = '/auth/signin';
                    }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-all border"
                    style={{ background: 'rgba(180,0,0,0.2)', borderColor: 'rgba(180,0,0,0.5)' }}
                  >
                    Sign In
                  </button>
                )}
                <p className="text-[9px] font-bold text-gray-700 uppercase tracking-[0.3em] text-center">
                  V2.4.0 · SECURE · OPERATIONAL
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
