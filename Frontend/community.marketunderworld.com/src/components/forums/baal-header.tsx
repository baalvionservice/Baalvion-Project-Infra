"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogIn, UserPlus, KeyRound, Compass } from "lucide-react";
import { getCommunities, type Community } from "@/lib/api/community";

// The forum's own navigation, shown under the site menu: the real communities, getting started, and access.
export function BaalHeader() {
  const pathname = usePathname();
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    getCommunities().then((all) => setCommunities(all.filter((c) => c.isForum)));
  }, []);

  const tab = (active: boolean) =>
    `flex items-center gap-1.5 px-3 h-9 rounded text-sm whitespace-nowrap transition-colors ${active ? "bg-[#251e30] text-[#f0f0f5] border border-[#3e3450] font-bold" : "text-gray-400 hover:text-white hover:bg-white/5 font-medium"}`;

  return (
    <header className="sticky top-[88px] z-40 bg-[#0e0c12]/95 backdrop-blur border-b border-[#2b2538] shadow-xl">
      <div className="container mx-auto px-3 sm:px-4 flex items-center gap-2 h-12">
        <nav aria-label="Forum" className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none]">
          <Link href="/forum" className="w-9 h-9 shrink-0 rounded bg-[#c0392b] hover:bg-[#d63031] text-white flex items-center justify-center mr-1" title="Forum home" aria-label="Forum home">
            <Home className="w-4 h-4" />
          </Link>
          <Link href="/forum/join" className={tab(pathname === "/forum/join")}><Compass className="w-3.5 h-3.5" /> Get started</Link>
          {communities.map((c) => (
            <Link key={c.slug} href={`/forum/${c.slug}`} className={tab(pathname.startsWith(`/forum/${c.slug}`))}>{c.name}</Link>
          ))}
          <Link href="/access" className={tab(pathname === "/access")}><KeyRound className="w-3.5 h-3.5 text-amber-500" /> Access</Link>
        </nav>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Link href="/auth/signin" className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10">
            <LogIn className="w-3.5 h-3.5 text-red-400" /> Log in
          </Link>
          <Link href="/auth/registration" className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-[#c0392b] hover:bg-[#d63031] text-white">
            <UserPlus className="w-3.5 h-3.5" /> Register
          </Link>
        </div>
      </div>
    </header>
  );
}
