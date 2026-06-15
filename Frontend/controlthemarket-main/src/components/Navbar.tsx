"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white/93 backdrop-blur-md border-b border-gray-200 transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-[1140px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="font-black text-[18px] text-gray-900 no-underline flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white text-sm font-black">
            ✓
          </div>
          ControlTheMarket
        </Link>

        {/* Nav Links */}
        <ul className="hidden md:flex gap-7 list-none">
          {[
            { label: "How it works", href: "/#hiw" },
            { label: "Blogs", href: "/blog" },
            { label: "Companies", href: "/companies" },
            { label: "Pricing", href: "/pricing" },
            { label: "About", href: "/about" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-gray-500 no-underline hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="flex gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-gray-800 rounded-lg hover:bg-gray-100 transition-all no-underline"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-[18px] py-[9px] text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 hover:-translate-y-px transition-all shadow-[0_4px_12px_rgba(34,197,94,0.3)] no-underline"
          >
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  );
}
