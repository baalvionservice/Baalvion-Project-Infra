"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Menu, X, ChevronDown } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Investing",
    href: "/investing",
    children: [
      { label: "Stocks", href: "/stocks" },
      { label: "ETFs", href: "/etfs" },
      { label: "Bonds", href: "/bonds" },
      { label: "Mutual Funds", href: "/mutual-funds" },
    ],
  },
  {
    label: "Markets",
    href: "/markets",
    children: [
      { label: "Live Quotes", href: "/markets" },
      { label: "Market News", href: "/market-news" },
      { label: "Economic Calendar", href: "/calendar" },
    ],
  },
  {
    label: "Banking",
    href: "/banking",
    children: [
      { label: "Savings Accounts", href: "/savings" },
      { label: "CDs", href: "/cd-rates" },
      { label: "Money Market", href: "/money-market" },
    ],
  },
  {
    label: "Personal Finance",
    href: "/personal-finance",
    children: [
      { label: "Budgeting", href: "/budgeting" },
      { label: "Retirement", href: "/retirement" },
      { label: "Credit Cards", href: "/credit-cards" },
      { label: "Insurance", href: "/insurance" },
    ],
  },
  {
    label: "Economy",
    href: "/economy",
    children: [
      { label: "Economic Indicators", href: "/indicators" },
      { label: "Inflation", href: "/inflation" },
      { label: "Interest Rates", href: "/interest-rates" },
    ],
  },
  {
    label: "Reviews",
    href: "/reviews",
    children: [
      { label: "Broker Reviews", href: "/broker-reviews" },
      { label: "Bank Reviews", href: "/bank-reviews" },
      { label: "App Reviews", href: "/app-reviews" },
    ],
  },
];

export function HeaderRefactored() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">
              I
            </div>
            <span className="hidden sm:inline">Imperialpedia</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {item.children && (
                  <div className="absolute left-0 mt-0 w-48 rounded-lg border border-border bg-background shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button
              className="p-2 rounded-lg hover:bg-muted text-foreground hover:text-primary transition-colors"
              aria-label="Search"
              title="Press Cmd+K to search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted text-foreground"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="lg:hidden border-t border-border py-4 space-y-2">
            {navItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="ml-4 space-y-1 mt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export default HeaderRefactored;
