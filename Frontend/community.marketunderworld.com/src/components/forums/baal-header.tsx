"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogIn, UserPlus, Search, ChevronDown, Award, Megaphone, Users, Sparkles } from "lucide-react";

export function BaalHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0e0c12]/95 backdrop-blur border-b border-[#2b2538] shadow-2xl">
      {/* Top utility bar */}
      <div className="hidden md:flex items-center justify-between px-6 py-1.5 bg-[#09080c] border-b border-[#1c1824] text-[11px] text-gray-400">
        <div className="flex items-center gap-4">
          <Link href="/forum" className="hover:text-red-400 transition-colors font-medium">Forums</Link>
          <span className="opacity-30">|</span>
          <Link href="/forum/category/making-money-and-courses" className="hover:text-red-400 transition-colors">Making Money & Courses</Link>
          <span className="opacity-30">|</span>
          <Link href="/forum/category/anonymity-section" className="hover:text-red-400 transition-colors">Anonymity Section</Link>
          <span className="opacity-30">|</span>
          <Link href="/forum/category/gaming-zone" className="hover:text-red-400 transition-colors">Gaming Zone</Link>
          <span className="opacity-30">|</span>
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Baalvion Network
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400">All Bookmarks</span>
        </div>
      </div>

      {/* Main navigation row */}
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        {/* Left: Home + Forum tabs */}
        <div className="flex items-center gap-1 h-full">
          {/* Red square home icon matching screenshot */}
          <Link
            href="/forum"
            className="w-10 h-10 rounded bg-[#c0392b] hover:bg-[#d63031] text-white flex items-center justify-center shadow-lg transition-colors mr-2"
            title="Home"
          >
            <Home className="w-5 h-5" />
          </Link>

          {/* Forums Tab (Active) */}
          <Link
            href="/forum"
            className={`flex items-center gap-1.5 px-3.5 h-10 rounded text-sm font-bold tracking-wide transition-all ${
              pathname.startsWith("/forum")
                ? "bg-[#251e30] text-[#f0f0f5] border border-[#3e3450]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>Forums</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Link>

          {/* What's New Tab */}
          <Link
            href="/forum"
            className="hidden sm:flex items-center gap-1.5 px-3.5 h-10 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>What's new</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Link>

          {/* Members Tab */}
          <Link
            href="/forum"
            className="hidden sm:flex items-center gap-1.5 px-3.5 h-10 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 opacity-70" />
            <span>Members</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </Link>

          {/* Awards */}
          <Link
            href="/forum"
            className="hidden lg:flex items-center gap-1 px-3.5 h-10 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Award className="w-3.5 h-3.5 opacity-70 text-amber-500" />
            <span>Awards</span>
          </Link>

          {/* Advertising */}
          <Link
            href="/forum"
            className="hidden lg:flex items-center gap-1 px-3.5 h-10 rounded text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Megaphone className="w-3.5 h-3.5 opacity-70 text-blue-400" />
            <span>Advertising</span>
          </Link>
        </div>

        {/* Right side: Log in & Register */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-red-400" />
            <span>Log in</span>
          </Link>

          <Link
            href="/auth/registration"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] text-white shadow-md transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
