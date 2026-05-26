"use client";

import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { HeaderWrapper } from "@/components/header-wrapper";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import GlobalSearch from "@/components/global-search";
import QuickSwitcher from "@/components/quick-switcher";
import ShortcutsHelp from "@/components/shortcuts-help";
import QuickActionsFAB from "@/components/quick-actions-fab";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [gPressed, setGPressed] = useState(false);
  const gPressTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOpenSearch = () => setSearchOpen(true);
    window.addEventListener("open-search", handleOpenSearch);
    return () => window.removeEventListener("open-search", handleOpenSearch);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSwitcherOpen((open) => !open);
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen((open) => !open);
      }

      if (gPressed && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        switch (e.key) {
          case "d":
            router.push("/dashboard");
            break;
          case "b":
            router.push("/businesses");
            break;
          case "f":
            router.push("/finance");
            break;
          case "e":
            router.push("/employees");
            break;
        }
        setGPressed(false);
        if (gPressTimeout.current) clearTimeout(gPressTimeout.current);
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !gPressed) {
        e.preventDefault();
        setGPressed(true);
        gPressTimeout.current = setTimeout(() => {
          setGPressed(false);
        }, 1500);
      }
    },
    [gPressed, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (gPressTimeout.current) clearTimeout(gPressTimeout.current);
    };
  }, [handleKeyDown]);

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="">
            <HeaderWrapper />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <QuickSwitcher open={switcherOpen} onOpenChange={setSwitcherOpen} />
      <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
      <QuickActionsFAB />
    </>
  );
}
