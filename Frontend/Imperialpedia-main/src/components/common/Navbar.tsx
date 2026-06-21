"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, ChevronDown, LayoutDashboard } from "lucide-react";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/state/app-store";

type NavLink = { label: string; href: string };
type NavCategory = {
  id: string;
  label: string;
  href: string;
  links: NavLink[];
};

/**
 * Investopedia-style editorial header: serif wordmark, horizontal category
 * nav with hover mega-menus, global search, and a signature gold Subscribe CTA.
 */
const NAV: NavCategory[] = [
  {
    id: "investing",
    label: "Investing",
    href: "/investing",
    links: [
      { label: "Stocks", href: "/stocks" },
      { label: "Bonds", href: "/bonds" },
      { label: "ETFs", href: "/etfs" },
      { label: "Mutual Funds", href: "/mutual-funds" },
      { label: "Options", href: "/options" },
      { label: "Commodities", href: "/commodities" },
      { label: "Cryptocurrency", href: "/cryptocurrency" },
      { label: "Real Estate", href: "/real-estate" },
      { label: "Retirement", href: "/retirement" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Brokers", href: "/brokers" },
      { label: "View all Investing", href: "/investing" },
    ],
  },
  {
    id: "markets",
    label: "Markets",
    href: "/market-news",
    links: [
      { label: "Market News", href: "/market-news" },
      { label: "Live Market News", href: "/live-market-news" },
      { label: "Company News", href: "/company-news" },
      { label: "Earnings", href: "/earnings" },
      { label: "Crypto", href: "/crypto" },
      { label: "Economic Calendar", href: "/calendar" },
      { label: "Indicators", href: "/indicators" },
      { label: "AI Analyst", href: "/ai-analyst" },
      { label: "View all News", href: "/news" },
    ],
  },
  {
    id: "banking",
    label: "Banking",
    href: "/banking",
    links: [
      { label: "Savings Accounts", href: "/savings" },
      { label: "Checking Accounts", href: "/checking" },
      { label: "CD Rates", href: "/cd-rates" },
      { label: "Money Market", href: "/money-market" },
      { label: "Credit Cards", href: "/credit-cards" },
      { label: "Personal Loans", href: "/loans" },
      { label: "Mortgages", href: "/mortgages" },
      { label: "Auto Loans", href: "/auto-loans" },
      { label: "Student Loans", href: "/student-loans" },
      { label: "Banking Reviews", href: "/banking-reviews" },
      { label: "View all Banking", href: "/banking" },
    ],
  },
  {
    id: "personal-finance",
    label: "Personal Finance",
    href: "/personal-finance",
    links: [
      { label: "How to Create a Monthly Budget", href: "/articles/how-to-create-a-monthly-budget" },
      { label: "50/30/20 Budget Rule", href: "/articles/50-30-20-budget-rule-explained" },
      { label: "Emergency Fund Guide", href: "/articles/emergency-fund-guide" },
      { label: "How to Build Wealth From Scratch", href: "/articles/how-to-build-wealth-from-scratch" },
      { label: "Debt Snowball vs Avalanche", href: "/articles/debt-snowball-vs-debt-avalanche" },
      { label: "Budgeting", href: "/budgeting" },
      { label: "Debt Management", href: "/debt" },
      { label: "Credit Scores", href: "/credit" },
      { label: "Calculators", href: "/financial-calculators" },
      { label: "View all Personal Finance", href: "/personal-finance" },
    ],
  },
  {
    id: "economy",
    label: "Economy",
    href: "/economy",
    links: [
      { label: "Economic Indicators", href: "/indicators" },
      { label: "Federal Reserve", href: "/fed" },
      { label: "Inflation", href: "/inflation" },
      { label: "GDP", href: "/gdp" },
      { label: "Unemployment", href: "/unemployment" },
      { label: "Interest Rates", href: "/interest-rates" },
      { label: "Fiscal Policy", href: "/fiscal-policy" },
      { label: "Monetary Policy", href: "/monetary-policy" },
      { label: "Global Economy", href: "/global" },
      { label: "View all Economy", href: "/economy" },
    ],
  },
  {
    id: "reviews",
    label: "Reviews",
    href: "/reviews",
    links: [
      { label: "Broker Reviews", href: "/broker-reviews" },
      { label: "Bank Reviews", href: "/bank-reviews" },
      { label: "Credit Card Reviews", href: "/credit-card-reviews" },
      { label: "Loan Reviews", href: "/loan-reviews" },
      { label: "Insurance Reviews", href: "/insurance-reviews" },
      { label: "Robo-Advisors", href: "/robo-advisors" },
      { label: "App Reviews", href: "/app-reviews" },
      { label: "Tax Software", href: "/tax-software" },
      { label: "View all Reviews", href: "/reviews" },
    ],
  },
];

export const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const pathname = usePathname();
  const { currentUser } = useAppStore();
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    setIsMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  // Keyboard shortcut: ⌘K / Ctrl+K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        {/* ── Primary bar ── */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: mobile toggle + wordmark */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden -ml-1 p-2 text-foreground"
                aria-label="Open menu"
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/" className="flex items-center" aria-label="Imperialpedia home">
                <span className="font-headline text-2xl font-black tracking-tight text-foreground">
                  Imperial<span className="text-primary">pedia</span>
                </span>
              </Link>
            </div>

            {/* Right: search + CTAs */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 h-9 w-40 lg:w-56 px-3 rounded-sm border border-border text-sm text-muted-foreground hover:border-primary/50 transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
                <kbd className="ml-auto hidden lg:inline text-[10px] font-semibold text-muted-foreground border border-border rounded px-1">
                  ⌘K
                </kbd>
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="sm:hidden p-2 text-foreground"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" /> Admin
                </Link>
              )}

              <Link
                href="/auth/sign-in"
                className="hidden sm:inline-flex items-center h-9 px-3 text-sm font-semibold text-foreground hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/premium/subscribe"
                className="inline-flex items-center h-9 px-4 rounded-sm bg-accent text-accent-foreground text-sm font-bold hover:brightness-95 transition-all"
              >
                Subscribe
              </Link>
            </div>
          </div>
        </div>

        {/* ── Category nav (desktop) ── */}
        <nav
          className="hidden lg:block border-t border-border bg-background"
          onMouseLeave={() => setOpenMenu(null)}
          aria-label="Primary"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ul className="flex items-stretch gap-1">
              {NAV.map((cat) => (
                <li
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(cat.id)}
                >
                  <Link
                    href={cat.href}
                    className={cn(
                      "flex items-center gap-1 h-11 px-3 text-[13px] font-bold uppercase tracking-wide transition-colors border-b-2",
                      isActive(cat.href)
                        ? "text-primary border-accent"
                        : "text-foreground border-transparent hover:text-primary"
                    )}
                  >
                    {cat.label}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Link>

                  {openMenu === cat.id && (
                    <div className="absolute left-0 top-full z-50 w-64 bg-background border border-border shadow-lg rounded-b-sm py-2">
                      {cat.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="block px-4 py-2 text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer ── */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-background shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <span className="font-headline text-xl font-black">
                Imperial<span className="text-primary">pedia</span>
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMobileOpen(false)}
                className="p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="py-2">
              {NAV.map((cat) => (
                <div key={cat.id} className="border-b border-border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold uppercase tracking-wide"
                    onClick={() =>
                      setOpenMobileSection((p) => (p === cat.id ? null : cat.id))
                    }
                  >
                    {cat.label}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openMobileSection === cat.id && "rotate-180"
                      )}
                    />
                  </button>
                  {openMobileSection === cat.id && (
                    <div className="pb-2">
                      {cat.links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="block px-6 py-2 text-sm text-muted-foreground hover:text-primary"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="p-4 space-y-2">
                <Link
                  href="/auth/sign-in"
                  className="block w-full text-center h-10 leading-10 rounded-sm border border-border font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  href="/premium/subscribe"
                  className="block w-full text-center h-10 leading-10 rounded-sm bg-accent text-accent-foreground font-bold"
                >
                  Subscribe
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};

export default Navbar;
