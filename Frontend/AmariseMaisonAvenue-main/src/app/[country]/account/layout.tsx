"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  Settings,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/lib/auth-context";

/**
 * Public auth pages (login / register / reset-password / forgot-password) render
 * standalone — they have their own full-page design and the visitor is logged
 * out. Mirrors the ACCOUNT_PUBLIC allow-list in src/middleware.ts.
 */
const PUBLIC_ACCOUNT_ROUTES = new Set([
  "login",
  "register",
  "reset-password",
  "forgot-password",
]);

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const accountIdx = segments.indexOf("account");
  const subRoute = accountIdx >= 0 ? segments[accountIdx + 1] : undefined;

  if (subRoute !== undefined && PUBLIC_ACCOUNT_ROUTES.has(subRoute)) {
    return <>{children}</>;
  }

  // Private member area — driven by the REAL authenticated user.
  return (
    <AuthProvider>
      <AccountShell>{children}</AccountShell>
    </AuthProvider>
  );
}

function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { country } = useParams();
  const countryCode = (country as string) || "us";
  const { user, loading, logout } = useAuth();

  // If the session can't be restored (expired/invalid refresh cookie), send the
  // visitor to login. Middleware also guards this, but the in-memory access token
  // is lost on hard navigation, so we re-check client-side.
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${countryCode}/account/login`);
    }
  }, [loading, user, countryCode, router]);

  // Only sections backed by a real service are exposed (decision: hide the rest).
  const menuItems = [
    { icon: <LayoutDashboard />, label: "Dashboard", href: `/${countryCode}/account` },
    { icon: <ShoppingBag />, label: "Acquisitions", href: `/${countryCode}/account/acquisitions` },
    { icon: <Heart />, label: "Private Archive", href: `/${countryCode}/account/wishlist` },
    { icon: <Settings />, label: "Identity", href: `/${countryCode}/account/settings` },
  ];

  const displayName = user?.name?.trim() || user?.email || "Member";
  const initial = (user?.name?.trim()?.[0] || user?.email?.[0] || "M").toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace(`/${countryCode}/account/login`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-plum animate-spin" aria-label="Loading your account" />
      </div>
    );
  }
  if (!user) return null; // redirect in-flight

  return (
    <div className="min-h-screen bg-ivory flex pt-10">
      <aside className="w-80 border-r border-border bg-white p-10 flex flex-col space-y-12 shrink-0 h-[calc(100vh-148px)] sticky top-[148px]">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-plum rounded-full flex items-center justify-center font-headline text-xl font-bold italic text-white shadow-lg">
              {initial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold uppercase tracking-tight text-gray-900 truncate">
                {displayName}
              </span>
              <span className="text-[10px] font-light text-gray-400 truncate">{user.email}</span>
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
                    pathname === item.href ? "text-plum" : "text-gray-300 group-hover:text-plum"
                  )}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { size: 16 } as any)}
                </span>
                <span className="text-left">{item.label}</span>
                {pathname === item.href && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            </Link>
          ))}
        </nav>

        <div className="pt-8 border-t border-border space-y-2">
          <Link href={`/${countryCode}`}>
            <button className="w-full flex items-center space-x-4 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black border-none bg-transparent outline-none cursor-pointer">
              <ChevronRight size={16} />
              <span>Back to Maison</span>
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-plum border-none bg-transparent outline-none cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-16 animate-fade-in overflow-x-hidden">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
