import Link from "next/link";
import { ImperialpediaMark } from "@/components/icons/ImperialpediaMark";
import { PreferredSourceButton } from "@/components/common/PreferredSourceButton";
import { withoutRetired } from "@/lib/content/retired-paths";
import { NEWS_SECTION_LIVE } from "@/config/sections";

/**
 * Shared dark footer for /world, /news, /market-news — promoted from
 * world/Footer.tsx (already dark, just the `#ce2b2b` → canonical
 * `hsl(var(--cnbc-red))` hex swap needed) so all three routes share one
 * footer instead of three near-duplicate copies.
 *
 * Every link below points at a real, live route. A few of the original CNBC
 * template labels (Watchlist, Screener, Newsletters, Podcasts, Apps) have no
 * corresponding page on this site and were dropped rather than left as
 * href="#" or pointed at a route that would 404 — both fail Google's
 * crawlable-links requirement just as badly as the placeholder they replace.
 *
 * 2026-09-10: that claim had gone stale. "Investing" and "Personal Finance"
 * were retired hubs 301ing to the homepage, "Premium" bounced anonymous
 * readers into a sign-in wall, and "Politics" is a live route with no articles
 * in it — a whole column of this footer led nowhere. Columns are filtered
 * through withoutRetired and any that empty out are dropped, so a future
 * retirement degrades this footer instead of quietly breaking it.
 */
export default function Footer() {
  const links: { label: string; href: string }[][] = [
    [
      ...(NEWS_SECTION_LIVE ? [{ label: "News", href: "/news" }] : []),
      { label: "World Markets", href: "/world" },
      { label: "Business", href: "/market-news" },
      { label: "Financial Intelligence", href: "/financial-intelligence" },
    ],
    [
      { label: "Stocks", href: "/stocks" },
      { label: "Budgeting", href: "/budgeting-basics" },
      { label: "Scams & Fraud Protection", href: "/fraud-protection" },
      { label: "Financial Tools", href: "/financial-tools" },
    ],
    [
      { label: "About Imperialpedia", href: "/about" },
      { label: "Advertise", href: "/advertise" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
    [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms-of-service" },
      { label: "RSS Feeds", href: "/feed.xml" },
    ],
  ]
    .map(withoutRetired)
    .filter((col) => col.length > 0);

  return (
    <footer className="bg-[#0B1528] text-gray-300 mt-8 border-t border-[#16284A]">
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="world-kicker flex items-center gap-2 bg-[#122344] text-white font-black text-xl px-3 py-1 tracking-tight rounded">
            <ImperialpediaMark className="h-5 w-5 text-white" />
            IMPERIALPEDIA
          </div>
          <p className="text-xs text-gray-500 max-w-sm">
            Markets, business, and personal-finance news &amp; analysis.
          </p>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {links.map((col, i) => (
            <div key={i} className="space-y-2">
              {col.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-gray-600">
              © 2026 Imperialpedia. All Rights Reserved.
            </p>
            <p className="text-[10px] text-gray-600">
              Market data may be delayed. For informational purposes only.
            </p>
          </div>
          <PreferredSourceButton theme="dark" />
        </div>
      </div>
    </footer>
  );
}
