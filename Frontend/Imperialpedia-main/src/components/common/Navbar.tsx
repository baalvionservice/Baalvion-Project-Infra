"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/design-system/layout/container";
import { Text } from "@/design-system/typography/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  LayoutDashboard,
} from "lucide-react";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/lib/state/app-store";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  // Track which mobile accordion section is open
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const { currentUser } = useAppStore();

  const shouldShowScrollProgress = () => {
    const rootSlugPattern = /^\/[^/]+$/;
    const termsPattern = /^\/terms\/[^/]+\/[^/]+$/;
    return rootSlugPattern.test(pathname) || termsPattern.test(pathname);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      if (shouldShowScrollProgress()) {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(Math.min(scrollTop / docHeight, 1));
      } else {
        setScrollProgress(0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setOpenSection(null);
  }, [pathname]);

  // ── Nav data ────────────────────────────────────────────────────────────────

  const newsLinks = [
    { label: t("nav.market_news"), href: "/market-news" },
    { label: t("nav.company_news"), href: "/company-news" },
    { label: t("nav.earnings"), href: "/earnings" },
    { label: t("nav.cd_rates"), href: "/cd-rates" },
    { label: t("nav.moratage_gates"), href: "/moratage-gates" },
    { label: t("nav.economy"), href: "/economy" },
    { label: t("nav.government"), href: "/government" },
    { label: t("nav.crypto"), href: "/crypto" },
    { label: t("nav.live_market_news"), href: "/live-market-news" },
    { label: t("nav.personal_finance"), href: "/personal-finance" },
    { label: t("nav.view_all"), href: "/news" },
  ];

  const investingLinks = [
    { label: t("nav.stocks"), href: "/stocks" },
    { label: t("nav.bonds"), href: "/bonds" },
    { label: t("nav.etfs"), href: "/etfs" },
    { label: t("nav.mutual_funds"), href: "/mutual-funds" },
    { label: t("nav.options"), href: "/options" },
    { label: t("nav.commodities"), href: "/commodities" },
    { label: t("nav.cryptocurrency"), href: "/cryptocurrency" },
    { label: t("nav.real_estate"), href: "/real-estate" },
    { label: t("nav.retirement_planning"), href: "/retirement" },
    { label: t("nav.portfolio_management"), href: "/portfolio" },
    { label: t("nav.view_all_investing"), href: "/investing" },
  ];

  const bankingLinks = [
    { label: t("nav.savings_accounts"), href: "/savings" },
    { label: t("nav.checking_accounts"), href: "/checking" },
    { label: t("nav.cd_rates"), href: "/cd-rates" },
    { label: t("nav.money_market"), href: "/money-market" },
    { label: t("nav.credit_cards"), href: "/credit-cards" },
    { label: t("nav.personal_loans"), href: "/loans" },
    { label: t("nav.mortgages"), href: "/mortgages" },
    { label: t("nav.auto_loans"), href: "/auto-loans" },
    { label: t("nav.student_loans"), href: "/student-loans" },
    { label: t("nav.banking_reviews"), href: "/banking-reviews" },
    { label: t("nav.view_all_banking"), href: "/banking" },
  ];

  const personalFinanceLinks = [
    { label: t("nav.budgeting"), href: "/budgeting" },
    { label: t("nav.debt_management"), href: "/debt" },
    { label: t("nav.credit_scores"), href: "/credit" },
    { label: t("nav.insurance"), href: "/insurance" },
    { label: t("nav.taxes"), href: "/taxes" },
    { label: t("nav.estate_planning"), href: "/estate-planning" },
    { label: t("nav.financial_planning"), href: "/planning" },
    { label: t("nav.emergency_fund"), href: "/emergency-fund" },
    { label: t("nav.side_hustles"), href: "/income" },
    { label: t("nav.financial_calculators"), href: "/financial-calculators" },
    {
      label: t("nav.view_all_personal_finance"),
      href: "/personal-finance",
    },
  ];

  const economyLinks = [
    { label: t("nav.economic_indicators"), href: "/indicators" },
    { label: t("nav.federal_reserve"), href: "/fed" },
    { label: t("nav.inflation"), href: "/inflation" },
    { label: t("nav.gdp"), href: "/gdp" },
    { label: t("nav.unemployment"), href: "/unemployment" },
    { label: t("nav.interest_rates"), href: "/interest-rates" },
    { label: t("nav.fiscal_policy"), href: "/fiscal-policy" },
    { label: t("nav.monetary_policy"), href: "/monetary-policy" },
    { label: t("nav.global_economy"), href: "/global" },
    { label: t("nav.economic_calendar"), href: "/calendar" },
    { label: t("nav.view_all_economy"), href: "/economy" },
  ];

  const reviewLinks = [
    { label: t("nav.broker_reviews"), href: "/best-online-brokers" },
    { label: t("nav.best_crypto_exchange_reviews"), href: "/best-crypto-exchanges" },
    { label: t("nav.best-cd-rates"), href: "/best-cd-rates" },
    { label: t("nav.best-savings-rates"), href: "/best-savings-rates" },
    { label: t("nav.best-life-insurance"), href: "/best-life-insurance" },
    { label: t("nav.best-mortgage-rates"), href: "/best-mortgage-rates" },
    { label: t("nav.best-robo-advisers"), href: "/best-robo-advisers" },
    { label: t("nav.best-personal-loans"), href: "/best-personal-loans" },
    { label: t("nav.best-debt-relief-companies"), href: "/best-debt-relief-companies" },
    { label: t("nav.view_all_reviews"), href: "/reviews" },
  ];

  // Grouped sections for the mobile drawer accordion
  const mobileSections = [
    { id: "news", label: t("nav.news"), href: "/news", links: newsLinks },
    {
      id: "investing",
      label: t("nav.investing"),
      href: "/investing",
      links: investingLinks,
    },
    {
      id: "banking",
      label: t("nav.banking"),
      href: "/banking",
      links: bankingLinks,
    },
    {
      id: "personal-finance",
      label: t("nav.personal_finance"),
      href: "/personal-finance",
      links: personalFinanceLinks,
    },
    {
      id: "economy",
      label: t("nav.economy"),
      href: "/economy",
      links: economyLinks,
    },
    {
      id: "reviews",
      label: t("nav.reviews"),
      href: "/reviews",
      links: reviewLinks,
    },
  ];

  const isAdmin = currentUser?.role === "admin";

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  // ── Search button (shared between scrolled/unscrolled) ───────────────────────
  const SearchButton = () => (
    <button
      onClick={() => setIsSearchOpen(true)}
      className="w-full relative group outline-none"
      aria-label="Open global search"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <div className="w-full h-10 pl-10 pr-12 rounded-xl bg-background/40 border border-white/5 text-sm text-muted-foreground flex items-center text-left hover:border-primary/20 transition-all">
        Search
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <span className="hidden xl:inline text-[9px] font-bold text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded border border-white/5">
          ⌘K
        </span>
        <Badge
          variant="outline"
          className="text-[8px] font-bold border-primary/20 bg-primary/5 text-primary"
        >
          AI
        </Badge>
      </div>
    </button>
  );

  return (
    <>
      {/* ── Main Navbar ── */}
      <nav
        role="navigation"
        aria-label="Main Platform Navigation"
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border-white/10 py-3 shadow-2xl"
            : "bg-transparent border-transparent py-5"
        )}
      >
        {/* Scroll progress bar */}
        {shouldShowScrollProgress() && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-300 ease-out"
            style={{
              width: `${scrollProgress * 100}%`,
              boxShadow:
                scrollProgress > 0
                  ? "0 0 8px rgba(var(--primary), 0.5)"
                  : "none",
            }}
          />
        )}

        <Container>
          <div
            className={cn(
              "flex flex-col items-start justify-start gap-4",
              isScrolled && "flex-row items-center"
            )}
          >
            {/* ── Top row: Logo + right controls ── */}
            <div
              className={cn(
                "flex flex-row-reverse md:flex-row w-full items-center justify-between",
                isScrolled && "w-fit"
              )}
            >
              {/* Logo */}
              <Link
                href="/"
                className="shrink-0 w-fit group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-lg outline-none"
                aria-label="Imperialpedia Home"
              >
                <Text
                  variant="h3"
                  className="font-bold tracking-tighter text-2xl group-hover:text-primary transition-colors"
                >
                  Imperial
                  <span className="text-foreground/60 group-hover:text-foreground">
                    pedia
                  </span>
                </Text>
              </Link>

              {/* Right side (non-scrolled) */}
              <div
                className={cn(
                  "flex items-center gap-3 shrink-0",
                  isScrolled && "hidden"
                )}
              >
                {/* Desktop search */}
                <div className="hidden md:flex w-52">
                  <SearchButton />
                </div>

                {/* Admin + theme/lang (desktop) */}
                <div className="hidden md:flex items-center gap-3">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-widest"
                      asChild
                    >
                      <Link href="/admin/dashboard">
                        <LayoutDashboard className="h-3.5 w-3.5" />
                        Mission Control
                      </Link>
                    </Button>
                  )}
                  <div className="hidden lg:flex items-center gap-3">
                    <ThemeToggle />
                    <LanguageSelector />
                  </div>
                </div>

                {/* Mobile hamburger */}
                <Button
                  onClick={() => setIsOpen(!isOpen)}
                  variant="ghost"
                  size="icon"
                  className="lg:hidden p-2 rounded-xl bg-card/30 border border-white/5 text-muted-foreground hover:text-primary transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
                  aria-label={isOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isOpen}
                >
                  {isOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* ── Desktop nav links row ── */}
            <div className="hidden w-full lg:flex items-center gap-8">
              {[
                {
                  id: "news",
                  label: t("nav.news"),
                  href: "/news",
                  links: newsLinks,
                },
                {
                  id: "investing",
                  label: t("nav.investing"),
                  href: "/investing",
                  links: investingLinks,
                },
                {
                  id: "banking",
                  label: t("nav.banking"),
                  href: "/banking",
                  links: bankingLinks,
                },
                {
                  id: "personal-finance",
                  label: t("nav.personal_finance"),
                  href: "/personal-finance",
                  links: personalFinanceLinks,
                },
                {
                  id: "economy",
                  label: t("nav.economy"),
                  href: "/economy",
                  links: economyLinks,
                },
                {
                  id: "reviews",
                  label: t("nav.reviews"),
                  href: "/reviews",
                  links: reviewLinks,
                },
              ].map((section) => (
                <div key={section.id} className="relative group">
                  <Link
                    href={section.href}
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
                  >
                    {section.label}
                    <ChevronDown className="h-3 w-3 transition-transform group-hover:rotate-180" />
                  </Link>
                  <div className="absolute top-full left-0 w-64 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 mt-2 p-2">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center p-3 rounded-xl hover:bg-primary/10 transition-all group/item"
                      >
                        <span className="text-sm font-medium text-foreground/80 group-hover/item:text-foreground">
                          {link.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Scrolled state: search + hamburger ── */}
            <div
              className={cn(
                "hidden items-center gap-4 shrink-0",
                isScrolled && "flex"
              )}
            >
              <div className="w-52">
                <SearchButton />
              </div>
              {/* Mobile hamburger (scrolled) */}
              <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="ghost"
                size="icon"
                className="lg:hidden p-2 rounded-xl bg-card/30 border border-white/5 text-muted-foreground hover:text-primary transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </Container>
      </nav>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── Drawer shell ── */}
      <aside
        aria-label="Mobile navigation"
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-full max-w-sm flex flex-col lg:hidden overflow-hidden",
          "bg-background transition-transform duration-200 ease-in-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/*
          PANEL WRAPPER
          Two panels sit side-by-side at 200% total width.
          Sliding to -50% reveals Panel 2 (sub-section).
        */}
        <div
          className={cn(
            "flex w-[200%] h-full transition-transform duration-300 ease-in-out",
            openSection ? "-translate-x-1/2" : "translate-x-0"
          )}
        >
          {/* ══════════════════════════════════════
              PANEL 1 — Main menu
          ══════════════════════════════════════ */}
          <div className="w-1/2 h-full flex flex-col shrink-0">
            {/* Header: X  Logo */}
            <div className="flex items-center gap-3 px-4 h-[52px] border-b border-border shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-foreground hover:text-muted-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="font-bold tracking-tighter text-[19px] leading-none"
              >
                Imperial<span className="text-foreground/50">pedia</span>
              </Link>
            </div>

            {/* Search */}
            <div className="px-4 pt-[14px] pb-[6px] shrink-0">
              <p className="text-[13px] text-foreground mb-[8px]">Search</p>
              <div className="flex h-[44px] overflow-hidden border border-border">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsOpen(false);
                      setIsSearchOpen(true);
                    }
                  }}
                  className="flex-1 px-3 text-[14px] bg-background text-foreground placeholder:text-muted-foreground/70 outline-none"
                />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="w-[46px] flex items-center justify-center bg-primary hover:bg-primary/90 transition-colors shrink-0"
                  aria-label="Search"
                >
                  <Search className="h-[17px] w-[17px] text-primary-foreground" />
                </button>
              </div>
            </div>

            {/* Scrollable nav + footer */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <nav className="mt-[6px]">
                {mobileSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setOpenSection(section.id)}
                    className="w-full flex items-center justify-between px-4 py-[16px] border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-foreground">
                      {section.label}
                    </span>
                    <ChevronRight className="h-[17px] w-[17px] text-foreground/50 shrink-0" />
                  </button>
                ))}

                {isAdmin && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-between px-4 py-[16px] border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <Link href="/admin/dashboard">
                      Mission Control
                    </Link>
                  </button>
                )}
              </nav>

              {/* Spacer gap between nav rows and footer links */}
              <div className="mt-8">
                {/* Newsletters */}
                <div className="px-4 py-[14px] border-b border-border">
                  <Link
                    href="/#"
                    onClick={() => setIsOpen(false)}
                    className="text-[14px] text-foreground/65 hover:text-primary transition-colors"
                  >
                    Newsletters
                  </Link>
                </div>

                {/* Follow Us */}
                <div className="px-4 pt-[18px] pb-6">
                  <p className="text-[14px] text-foreground/65 mb-[14px]">
                    Follow Us
                  </p>
                  <div className="flex items-center gap-[20px]">
                    {/* Facebook */}
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="text-foreground/50 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-[22px] w-[22px]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                    </a>
                    {/* Instagram */}
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="text-foreground/50 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-[22px] w-[22px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="2"
                          y="2"
                          width="20"
                          height="20"
                          rx="5"
                          ry="5"
                        />
                        <circle cx="12" cy="12" r="4" />
                        <circle
                          cx="17.5"
                          cy="6.5"
                          r="0.5"
                          fill="currentColor"
                          stroke="none"
                        />
                      </svg>
                    </a>
                    {/* YouTube */}
                    <a
                      href="https://youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="YouTube"
                      className="text-foreground/50 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-[22px] w-[22px]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
                        <polygon
                          fill="white"
                          points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
                        />
                      </svg>
                    </a>
                    {/* TikTok */}
                    <a
                      href="https://tiktok.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="TikTok"
                      className="text-foreground/50 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-[22px] w-[22px]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.85 4.85 0 0 1-1-.13z" />
                      </svg>
                    </a>
                    {/* LinkedIn */}
                    <a
                      href="https://linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="text-foreground/50 hover:text-primary transition-colors"
                    >
                      <svg
                        className="h-[22px] w-[22px]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Theme + lang at very bottom */}
              <div className="px-4 py-4 border-t border-border flex items-center gap-3">
                <ThemeToggle />
                <LanguageSelector />
              </div>
            </div>
          </div>
          {/* end Panel 1 */}

          {/* ══════════════════════════════════════
              PANEL 2 — Sub-section links only
              No search, no footer, just back + links
          ══════════════════════════════════════ */}
          <div className="w-1/2 h-full flex flex-col shrink-0 bg-background">
            {/* Back header */}
            <div className="flex items-center h-[52px] border-b border-border shrink-0 px-2">
              <button
                onClick={() => setOpenSection(null)}
                className="flex items-center gap-[2px] px-2 h-full text-foreground hover:text-primary transition-colors"
                aria-label="Back to main menu"
              >
                <ChevronRight className="h-[17px] w-[17px] rotate-180 shrink-0" />
                <span className="text-[14px] font-medium">Back</span>
              </button>
            </div>

            {/* Sub-links for whichever section is active */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {mobileSections.map((section) => (
                <div
                  key={section.id}
                  className={openSection === section.id ? "block" : "hidden"}
                >
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => {
                        setOpenSection(null);
                        setIsOpen(false);
                      }}
                      className="flex items-center px-4 py-[16px] border-b border-border text-[14px] text-foreground hover:text-primary hover:bg-muted/30 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* end Panel 2 */}
        </div>
        {/* end panel wrapper */}
      </aside>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
};
