"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  User,
  ShoppingBag,
  Heart,
  MessageSquare,
  ShieldCheck,
  Settings,
  ChevronRight,
  Crown,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Wallet,
  Video,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { country } = useParams();
  const countryCode = (country as string) || "us";
  const { currentUser, activeVip } = useAppStore();

  const menuItems = [
    {
      icon: <LayoutDashboard />,
      label: "Dashboard",
      href: `/${countryCode}/account`,
    },
    {
      icon: <Crown />,
      label: "Membership",
      href: `/${countryCode}/account/membership`,
    },
    {
      icon: <Wallet />,
      label: "Treasury",
      href: `/${countryCode}/account/wallet`,
    },
    {
      icon: <ShoppingBag />,
      label: "Acquisitions",
      href: `/${countryCode}/account/acquisitions`,
    },
    {
      icon: <Award />,
      label: "Heritage Archive",
      href: `/${countryCode}/account/certificates`,
    },
    {
      icon: <Video />,
      label: "Live Ateliers",
      href: `/${countryCode}/account/live`,
    },
    {
      icon: <Heart />,
      label: "Private Archive",
      href: `/${countryCode}/account/wishlist`,
    },
    {
      icon: <MessageSquare />,
      label: "Curation",
      href: `/${countryCode}/account/curation`,
    },
    {
      icon: <LifeBuoy />,
      label: "Concierge",
      href: `/${countryCode}/account/concierge`,
    },
    {
      icon: <Settings />,
      label: "Identity",
      href: `/${countryCode}/account/settings`,
    },
  ];

  return (
    <div className="min-h-screen bg-ivory flex pt-10">
      {/* Client Sidebar */}
      <aside className="w-80 border-r border-border bg-white p-10 flex flex-col space-y-12 shrink-0 h-[calc(100vh-148px)] sticky top-[148px]">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-plum rounded-full flex items-center justify-center font-headline text-xl font-bold italic text-white shadow-lg">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase tracking-tight text-gray-900">
                {currentUser?.name}
              </span>
              <div className="flex items-center space-x-2">
                <Crown className="w-3 h-3 text-gold" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-plum">
                  {activeVip?.tier || "Member"}
                </span>
              </div>
            </div>
          </div>
          <div className="h-px w-full bg-border" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all group border-none bg-transparent outline-none cursor-pointer",
                  pathname === item.href
                    ? "bg-ivory text-plum border-l-2 border-plum"
                    : "text-gray-400 hover:text-plum hover:bg-ivory/50"
                )}
              >
                <span
                  className={cn(
                    "transition-transform group-hover:scale-110",
                    pathname === item.href
                      ? "text-plum"
                      : "text-gray-300 group-hover:text-plum"
                  )}
                >
                  {React.cloneElement(
                    item.icon as React.ReactElement,
                    { size: 16 } as any
                  )}
                </span>
                <span className="text-left">{item.label}</span>
                {pathname === item.href && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                )}
              </button>
            </Link>
          ))}
        </nav>

        <div className="pt-8 border-t border-border space-y-2">
          <Link href={`/${countryCode}`}>
            <button className="w-full flex items-center space-x-4 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black border-none bg-transparent outline-none cursor-pointer">
              <LogOut size={16} />
              <span>Back to Maison</span>
            </button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-16 animate-fade-in overflow-x-hidden">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
