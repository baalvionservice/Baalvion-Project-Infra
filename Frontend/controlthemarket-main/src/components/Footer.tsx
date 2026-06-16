"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[hsl(220,15%,14%)] text-white/50 py-[54px] px-6 pb-[26px]">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-9 mb-10">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-white font-black text-[17px] flex items-center gap-1.5 no-underline mb-2.5"
            >
              <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-sm font-black">
                ✓
              </div>
              ControlTheMarket
            </Link>
            <p className="text-[13px] leading-[1.7] max-w-[250px]">
              The proof-of-skill hiring platform for the modern era. Where talent is proven, not promised.
            </p>
          </div>

          {/* Platform */}
          <div>
            <div className="text-[10px] font-black text-white uppercase tracking-[1px] mb-3">
              Platform
            </div>
            <ul className="flex flex-col gap-1.5 list-none p-0">
              {[
                { label: "Leaderboard", href: "/leaderboard" },
                { label: "Companies", href: "/companies" },
                { label: "Candidates", href: "/leaderboard" },
                { label: "Pricing", href: "/pricing" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-white/45 no-underline hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="text-[10px] font-black text-white uppercase tracking-[1px] mb-3">
              Company
            </div>
            <ul className="flex flex-col gap-1.5 list-none p-0">
              {[
                { label: "About us", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Careers", href: "/contact" },
                { label: "Contact", href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-white/45 no-underline hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[10px] font-black text-white uppercase tracking-[1px] mb-3">
              Legal
            </div>
            <ul className="flex flex-col gap-1.5 list-none p-0">
              {[
                { label: "Privacy policy", href: "/privacy" },
                { label: "Terms of service", href: "/terms" },
                { label: "Cookie policy", href: "/privacy" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-white/45 no-underline hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/7 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2.5 flex-wrap text-xs">
          <span>
            © 2026 ControlTheMarket —{" "}
            <Link href="https://controlthemarket.com" className="text-white/35 hover:text-white transition-colors no-underline">
              controlthemarket.com
            </Link>
          </span>
          <span className="flex gap-2 items-center">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Sitemap", href: "/sitemap.xml" },
            ].map((item, i) => (
              <span key={item.label} className="flex items-center gap-2">
                {i > 0 && <span>·</span>}
                <Link href={item.href} className="text-white/35 hover:text-white transition-colors no-underline">
                  {item.label}
                </Link>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
