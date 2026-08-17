import Link from "next/link";
import { ImperialpediaMark } from "@/components/icons/ImperialpediaMark";

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
 */
export default function Footer() {
  const links: { label: string; href: string }[][] = [
    [
      { label: "News", href: "/news" },
      { label: "World Markets", href: "/world" },
      { label: "Business", href: "/market-news" },
      { label: "Politics", href: "/politics" },
    ],
    [
      { label: "Investing", href: "/investing" },
      { label: "Personal Finance", href: "/personal-finance" },
      { label: "Premium", href: "/premium" },
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
  ];

  return (
    <footer className="bg-black text-gray-400 mt-8">
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="world-kicker flex items-center gap-2 bg-[hsl(var(--cnbc-red))] text-white font-black text-xl px-3 py-1 tracking-tight">
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
        <div className="border-t border-gray-800 pt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] text-gray-600">
            © 2026 Imperialpedia. All Rights Reserved.
          </p>
          <p className="text-[10px] text-gray-600">
            Market data may be delayed. For informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
