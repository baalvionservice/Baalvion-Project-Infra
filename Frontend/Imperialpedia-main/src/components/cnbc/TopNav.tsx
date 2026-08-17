"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImperialpediaMark } from "@/components/icons/ImperialpediaMark";
import { SearchModal } from "@/components/search/SearchModal";

// Real destinations only. The original navCategories list (worldData.ts) also
// had "Health & Science", "Media", "Energy", and "Climate" -- none of which
// have a corresponding page anywhere on the site, so rather than link them to
// a 404 (or leave them as decorative buttons that go nowhere, the bug this
// list replaces) they're left out entirely.
const NAV_CATEGORIES: { label: string; href: string }[] = [
  { label: "Markets", href: "/market-news" },
  { label: "Business", href: "/market-news" },
  { label: "Investing", href: "/investing" },
  { label: "Politics", href: "/politics" },
  { label: "World", href: "/world" },
  { label: "Finance", href: "/financial-intelligence" },
  { label: "Real Estate", href: "/real-estate" },
  { label: "Personal Finance", href: "/personal-finance" },
];

// "Wed, Apr 8, 2026" was hardcoded here — never wired to an actual clock, so it
// just froze at whatever date someone typed in and never matched "today."
// Starts empty and fills in only after mount (never during SSR) — the browser's
// timezone almost never matches the server's, so computing `new Date()` during
// SSR would render one string, then immediately mismatch on hydration once the
// client recomputes it in its own timezone. 60s refresh is plenty for a
// date+time masthead; no need for per-second re-renders.
function useLiveMastheadClock(): string {
  const [now, setNow] = useState("");
  useEffect(() => {
    const format = () =>
      new Date().toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    setNow(format());
    const id = setInterval(() => setNow(format()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * Shared dark CNBC-style masthead for /world, /news, /market-news — promoted
 * from world/TopNav.tsx (nothing about it was actually /world-specific; its
 * links already point cross-site to /markets, /personal-finance, /terms) so
 * all three routes share one nav instead of three near-duplicate copies.
 * Re-themed from the original light (`bg-white`) version to the canonical
 * CNBC black/red palette (`#ce2b2b` → `hsl(var(--cnbc-red))`) as part of the
 * same move, to avoid a separate follow-up edit.
 */
export default function TopNav() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const liveClock = useLiveMastheadClock();

  // Same ⌘K/Ctrl+K fallback the sitewide Navbar provides — TopNav replaces
  // Navbar entirely on /world, /news, /market-news (see RootLayoutClient's
  // CNBC_ROUTES exclusion), so this shortcut doesn't exist anywhere else on
  // these routes unless it's wired here too.
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

  return (
    <>
      <header className="bg-black border-b border-white/15 sticky top-0 z-50">
      {/* Logo bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="Imperialpedia home"
            className="flex items-center gap-1.5 bg-[hsl(var(--cnbc-red))] text-white px-2 py-1 leading-none"
          >
            <ImperialpediaMark className="h-4 w-4 text-white" />
            <span className="world-kicker font-black text-sm tracking-wide">IMPERIALPEDIA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-xs text-white/60 font-medium">
            <Link href="/market-news" className="hover:text-[hsl(var(--cnbc-red))] transition-colors px-2 py-1">Markets</Link>
            <span className="text-white/20">|</span>
            <Link href="/personal-finance" className="hover:text-[hsl(var(--cnbc-red))] transition-colors px-2 py-1">Personal Finance</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span className="hidden sm:block" suppressHydrationWarning>{liveClock}</span>
          <button className="world-kicker bg-[hsl(var(--cnbc-red))] text-white text-xs font-bold px-3 py-1.5 rounded-sm hover:opacity-90 transition-opacity">
            SUBSCRIBE
          </button>
          <button
            type="button"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
            className="text-white/60 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category nav */}
      <div className="overflow-x-auto scrollbar-hide">
        <nav className="flex items-center px-4 gap-0 min-w-max">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className={`world-kicker text-xs font-semibold tracking-wide px-3 py-3 border-b-2 transition-all whitespace-nowrap ${
                pathname === cat.href
                  ? "border-[hsl(var(--cnbc-red))] text-[hsl(var(--cnbc-red))]"
                  : "border-transparent text-white/60 hover:text-[hsl(var(--cnbc-red))] hover:border-white/30"
              }`}
            >
              {cat.label.toUpperCase()}
            </Link>
          ))}
        </nav>
      </div>
      </header>
      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}
