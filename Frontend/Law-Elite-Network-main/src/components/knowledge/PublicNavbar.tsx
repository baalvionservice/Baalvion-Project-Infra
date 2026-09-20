"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  ChevronDown,
  Search as SearchIcon,
  UserPlus,
  LayoutDashboard,
  Linkedin,
} from 'lucide-react';
import { LawEliteMark } from '@/components/icons/LawEliteMark';
import SearchBar from '../search/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import { sharedSignInUrl } from '@/lib/shared-auth';
import { PRIMARY_NAV } from '@/lib/site-nav';

/**
 * @fileOverview Public masthead. Two tiers: a white brand/utility row over a
 * black section bar. The sections, their dropdowns and the mobile drawer all
 * render from PRIMARY_NAV (src/lib/site-nav.ts), so nothing here changes when
 * a section is added.
 */
export function PublicNavbar() {
  const { isAuthenticated, role } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Full-screen overlay: lock background scroll while it's open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  const dashboardHref =
    role === 'admin' ? '/admin/dashboard' : role === 'lawyer' ? '/lawyer/dashboard' : '/dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-white shadow-[0_1px_0_rgba(15,23,42,0.08)]">
      {/* Brand accent hairline */}
      <div className="absolute top-0 inset-x-0 h-[3px] z-20 bg-[#E13131]" />

      {/* ── Tier 1: brand + utilities ─────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl h-[60px] flex items-center justify-between gap-4">
          
          {/* Left: SECTIONS + links */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              onClick={() => (isMobileMenuOpen ? closeMobileMenu() : setIsMobileMenuOpen(true))}
              className="flex items-center gap-2 text-slate-900 hover:text-[#E13131] transition-colors"
              aria-label="Sections menu"
            >
              <Menu className="w-5 h-5 text-slate-900" />
              <span className="text-xs font-black uppercase tracking-wider">SECTIONS</span>
            </button>
          </div>

          {/* Center: Logo — scales mark + LAW ELITE NETWORK wordmark */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Law Elite Network – Home">
            {/* Scales of Justice mark */}
            <svg viewBox="0 0 64 64" className="h-9 w-9 flex-shrink-0" aria-hidden="true">
              <rect x="0" y="0" width="64" height="64" fill="#0F2440" rx="4"/>
              <rect x="8" y="17" width="48" height="6" fill="#F6F4EF"/>
              <rect x="29" y="23" width="6" height="14" fill="#F6F4EF"/>
              <polygon points="20,52 44,52 32,37" fill="#F6F4EF"/>
              <rect x="10" y="23" width="3" height="10" fill="#F6F4EF"/>
              <rect x="51" y="23" width="3" height="10" fill="#F6F4EF"/>
              <circle cx="11.5" cy="38" r="9" fill="#C8A24A"/>
              <circle cx="52.5" cy="38" r="9" fill="#C8A24A"/>
              <rect x="0" y="57" width="64" height="7" fill="#E13131"/>
            </svg>
            {/* Wordmark */}
            <span className="flex flex-col leading-none">
              <span className="font-headline text-xl font-black tracking-tight text-[#0F2440] uppercase leading-none">
                LAW ELITE
              </span>
              <span className="bg-[#E13131] text-white text-[9px] font-black uppercase tracking-[0.18em] px-1.5 py-[2px] mt-0.5 leading-none">
                NETWORK
              </span>
            </span>
          </Link>

          {/* Right: Search, TIPS, SIGN IN */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center text-slate-800 hover:text-[#E13131] transition-colors"
              aria-label="Search"
            >
              <SearchIcon className="w-4 h-4" />
            </button>

            <Link
              href="/tips"
              className="bg-[#E13131] hover:bg-red-700 text-white font-black text-xs uppercase px-4 py-1.5 tracking-wider transition-colors"
            >
              TIPS
            </Link>

            {isAuthenticated && (
              <Link
                href="/following"
                className="hidden md:inline text-xs font-black uppercase tracking-wider text-slate-900 hover:text-[#E13131] transition-colors"
              >
                Following
              </Link>
            )}

            {isAuthenticated ? (
              <Link href={dashboardHref}>
                <button className="border border-slate-300 hover:border-slate-900 text-slate-900 font-bold text-xs uppercase px-3 py-1.5 tracking-wider transition-colors">
                  DASHBOARD
                </button>
              </Link>
            ) : (
              <button
                onClick={() => window.location.assign(sharedSignInUrl())}
                className="border border-slate-300 hover:border-slate-900 text-slate-900 font-bold text-xs uppercase px-3 py-1.5 tracking-wider transition-colors"
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden border-t border-slate-100 px-4 py-3 bg-white">
            <SearchBar variant="navbar" />
          </div>
        )}
      </div>

      {/* ── Tier 2: black section bar (desktop) ─────────────────────── */}
      <nav className="hidden lg:block bg-black text-white" aria-label="Sections">
        <ul className="container mx-auto px-6 max-w-7xl h-10 flex items-stretch gap-7">
          {PRIMARY_NAV.map((section) => (
            <li key={section.label} className="group relative flex items-stretch">
              <Link
                href={section.href}
                className="flex items-center gap-1 whitespace-nowrap text-xs font-black uppercase tracking-wider text-white group-hover:text-[#E13131] group-focus-within:text-[#E13131] transition-colors"
              >
                {section.label}
                {section.children && <ChevronDown className="w-3 h-3 opacity-60" aria-hidden="true" />}
              </Link>
              {section.children && (
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-0 top-full min-w-[220px] bg-white text-slate-900 border-t-2 border-[#E13131] shadow-xl py-2">
                  {section.children.map((child) => (
                    <Link
                      key={child.href + child.label}
                      href={child.href}
                      className="block px-5 py-2 text-[13px] font-semibold hover:bg-slate-50 hover:text-[#E13131] transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Mobile drawer: full-screen, two-screen (list -> drill in) ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[10000] bg-white flex flex-col">
          {/* Drawer header: brand + close, same row every screen so the drawer never re-flows height. */}
          <div className="flex items-center justify-between h-[60px] px-4 border-b border-slate-100 shrink-0">
            <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#0F2440] flex items-center justify-center">
                <LawEliteMark variant="white" className="w-5 h-5" />
              </div>
              <span className="font-headline text-[1.05rem] font-extrabold tracking-tight text-slate-900">
                Law Elite
              </span>
            </Link>
            <button
              onClick={closeMobileMenu}
              className="w-9 h-9 flex items-center justify-center text-slate-900"
              aria-label="Close navigation menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 shrink-0">
            <SearchBar variant="navbar" />
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <nav aria-label="Mobile navigation">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="flex items-center h-14 px-5 text-[15px] font-bold text-slate-900 border-b border-slate-100 active:bg-slate-50"
              >
                Home
              </Link>
              {PRIMARY_NAV.map((section) =>
                section.children ? (
                  <details key={section.label} className="group border-b border-slate-100">
                    <summary className="flex items-center justify-between h-14 px-5 text-[15px] font-bold text-slate-900 cursor-pointer list-none active:bg-slate-50 [&::-webkit-details-marker]:hidden">
                      {section.label}
                      <ChevronDown className="w-5 h-5 text-slate-300 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="bg-slate-50 pb-2">
                      <Link
                        href={section.href}
                        onClick={closeMobileMenu}
                        className="flex items-center h-11 px-8 text-[13px] font-bold text-blue-700"
                      >
                        All {section.label}
                      </Link>
                      {section.children.map((child) => (
                        <Link
                          key={child.href + child.label}
                          href={child.href}
                          onClick={closeMobileMenu}
                          className="flex items-center h-11 px-8 text-[14px] font-semibold text-slate-700 active:bg-slate-100"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </details>
                ) : (
                  <Link
                    key={section.label}
                    href={section.href}
                    onClick={closeMobileMenu}
                    className="flex items-center h-14 px-5 text-[15px] font-bold text-slate-900 border-b border-slate-100 active:bg-slate-50"
                  >
                    {section.label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          {/* Drawer footer: sign-in (hidden sm:inline-flex in the tier-1 row above, so
              this is its only surface on a true mobile viewport) + social, mirroring the
              account/follow block most editorial-site mobile menus close on. */}
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 flex items-center justify-between">
            {isAuthenticated ? (
              <Link
                href={dashboardHref}
                onClick={closeMobileMenu}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            ) : (
              <button
                onClick={() => {
                  closeMobileMenu();
                  window.location.assign(sharedSignInUrl());
                }}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"
              >
                <UserPlus className="w-4 h-4" /> Sign In
              </button>
            )}
            {isAuthenticated && (
              <Link href="/following" onClick={closeMobileMenu} className="text-sm font-bold text-slate-900">
                Following
              </Link>
            )}
            <div className="flex items-center gap-4">
              <Link
                href="https://www.linkedin.com/company/law-elite-network"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Law Elite Network on LinkedIn"
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Linkedin className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                href="https://x.com/lawelitenetwork"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Law Elite Network on X"
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
