"use client";

import Link from "next/link";

export default function BlogNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 h-[60px] flex items-center justify-between px-6">
      <Link
        href="/"
        className="flex items-center gap-1.5 font-black text-[17px] text-gray-900 no-underline"
      >
        <div className="w-[26px] h-[26px] bg-green-600 rounded-[7px] flex items-center justify-center text-white text-xs font-black">
          ✓
        </div>
        SkillMatch Pro
      </Link>

      <div className="flex items-center gap-4 text-[13px]">
        <Link href="/" className="text-gray-500 font-medium no-underline hover:text-gray-900 transition-colors hidden sm:inline">
          Home
        </Link>
        <Link href="/blog" className="text-green-600 font-medium no-underline hidden sm:inline">
          Blog
        </Link>
        <Link href="/pricing" className="text-gray-500 font-medium no-underline hover:text-gray-900 transition-colors hidden sm:inline">
          Pricing
        </Link>
        <Link
          href="/signup"
          className="bg-green-600 text-white text-[13px] font-semibold px-4 py-[7px] rounded-lg no-underline hover:bg-green-700 transition-colors"
        >
          Get started free
        </Link>
      </div>
    </nav>
  );
}
