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
              href="#"
              className="text-white font-black text-[17px] flex items-center gap-1.5 no-underline mb-2.5"
            >
              <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-sm font-black">
                ✓
              </div>
              SkillMatch Pro
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
              {["Leaderboard", "Companies", "Candidates", "Pricing"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[13px] text-white/45 no-underline hover:text-white transition-colors"
                  >
                    {item}
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
              {["About us", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[13px] text-white/45 no-underline hover:text-white transition-colors"
                  >
                    {item}
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
              {["Privacy policy", "Terms of service", "Cookie policy"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[13px] text-white/45 no-underline hover:text-white transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/7 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2.5 flex-wrap text-xs">
          <span>
            © 2026 SkillMatch Pro —{" "}
            <Link href="https://controlthemarket.com" className="text-white/35 hover:text-white transition-colors no-underline">
              controlthemarket.com
            </Link>
          </span>
          <span className="flex gap-2 items-center">
            {["Privacy", "Terms", "Sitemap"].map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && <span>·</span>}
                <Link href="#" className="text-white/35 hover:text-white transition-colors no-underline">
                  {item}
                </Link>
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
