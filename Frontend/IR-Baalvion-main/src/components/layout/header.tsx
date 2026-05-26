"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Loader2,
  LogOut,
  LayoutDashboard,
  Bell,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navigationService } from "@/core/services/navigation.service";
import { authService } from "@/core/services/auth.service";
import { NavigationItem, UserRole } from "@/core/content/schemas";
import { AlertsSidebar } from "@/components/notifications/AlertsSidebar";
import { LanguageSelector } from "./LanguageSelector";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [userRole, setUserRole] = useState<UserRole>("public");
  const [isLoading, setIsLoading] = useState(true);

  const loadNavigation = useCallback(async () => {
    setIsLoading(true);
    const { role } = await authService.getCurrentUser();
    setUserRole(role);
    const response = await navigationService.getNavigation();
    if (response.success) {
      setNavItems(response.data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });

    loadNavigation();
    window.addEventListener("storage", loadNavigation);
    window.addEventListener("auth-updated", loadNavigation);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", loadNavigation);
      window.removeEventListener("auth-updated", loadNavigation);
    };
  }, [loadNavigation]);

  const closeSheet = () => setIsSheetOpen(false);

  return (
    <>
      <header
        role="banner"
        className={cn(
          "sticky top-0 z-50 flex h-16 items-center border-b transition-all duration-300",
          scrolled
            ? "border-border bg-background/80 backdrop-blur-md"
            : "border-transparent bg-background"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity"
              aria-label="Baalvion Home"
            >
              <span className="hidden sm:inline-block tracking-tighter text-xl">
                Baalvion
              </span>
            </Link>

            <nav
              className="hidden lg:flex items-center gap-1"
              aria-label="Main Navigation"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-4">
                  <Loader2
                    className="h-3 w-3 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Loading Menu...</span>
                </div>
              ) : (
                <NavItems items={navItems} />
              )}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
            {userRole !== "public" && (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10"
                onClick={() => setIsAlertsOpen(true)}
                aria-label="View institutional alerts"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              </Button>
            )}

            <LanguageSelector />

            <div className="hidden md:flex items-center gap-2">
              <AuthButtons userRole={userRole} />
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-9 w-9 sm:h-10 sm:w-10"
                  aria-label="Open Mobile Menu"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[85vw] sm:max-w-xs p-0 border-r-0"
              >
                <SheetHeader className="p-6 border-b bg-muted/20">
                  <SheetTitle className="text-left flex items-center gap-2 font-bold">
                    <span className="tracking-tighter">Baalvion Portal</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-[calc(100vh-73px)]">
                  <nav
                    className="flex-1 overflow-y-auto py-6"
                    aria-label="Mobile Navigation"
                  >
                    <div className="px-4 space-y-6">
                      <NavItems
                        items={navItems}
                        isMobile
                        onLinkClick={closeSheet}
                      />
                    </div>
                  </nav>
                  <div className="p-6 border-t bg-muted/5">
                    <AuthButtons
                      userRole={userRole}
                      isMobile
                      onAction={closeSheet}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AlertsSidebar open={isAlertsOpen} onOpenChange={setIsAlertsOpen} />
    </>
  );
}

const NavItems = memo(
  ({
    items,
    isMobile,
    onLinkClick,
  }: {
    items: NavigationItem[];
    isMobile?: boolean;
    onLinkClick?: () => void;
  }) => {
    return items.map((item) => {
      if (item.children && item.children.length > 0) {
        if (isMobile) {
          return (
            <div key={item.id} className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">
                {item.label}
              </p>
              <div className="space-y-1 flex flex-col">
                {item.children.map((child) => (
                  <NavChild
                    key={child.id}
                    child={child}
                    onLinkClick={onLinkClick}
                    isMobile
                  />
                ))}
              </div>
            </div>
          );
        }
        return (
          <DropdownMenu key={item.id}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground text-sm font-semibold flex items-center gap-1 px-3 h-9"
              >
                {item.label}{" "}
                <ChevronDown
                  className="h-3 w-3 opacity-50"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
              {item.children.map((child) => (
                <NavChild
                  key={child.id}
                  child={child}
                  onLinkClick={onLinkClick}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
      return (
        <Link
          key={item.id}
          href={item.href || "#"}
          onClick={onLinkClick}
          className={cn(
            "text-sm font-semibold transition-all px-3 py-2 rounded-md block",
            isMobile
              ? "text-base hover:bg-muted hover:pl-4"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {item.label}
        </Link>
      );
    });
  }
);

NavItems.displayName = "NavItems";

function NavChild({
  child,
  onLinkClick,
  isMobile,
}: {
  child: NavigationItem;
  onLinkClick?: () => void;
  isMobile?: boolean;
}) {
  if (child.isHeader) {
    return (
      <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground pt-4 pb-1 font-bold px-2">
        {child.label}
      </DropdownMenuLabel>
    );
  }
  if (child.label === "---")
    return <DropdownMenuSeparator className="my-2" aria-hidden="true" />;

  if (isMobile) {
    return (
      <Link
        href={child.href || "#"}
        onClick={onLinkClick}
        className="flex items-center justify-between text-sm font-medium text-foreground/80 hover:text-primary py-2 px-2 rounded-md hover:bg-primary/5 transition-colors"
      >
        {child.label}
        <ChevronRight className="h-3 w-3 opacity-30" />
      </Link>
    );
  }

  return (
    <DropdownMenuItem asChild className="cursor-pointer">
      <Link href={child.href || "#"} onClick={onLinkClick}>
        {child.label}
      </Link>
    </DropdownMenuItem>
  );
}

function AuthButtons({ userRole, isMobile, onAction }: any) {
  console.log("userRole is ", userRole);
  if (userRole !== "public") {
    return (
      <div
        className={cn("flex items-center gap-2", isMobile && "flex-col w-full")}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            authService.signOut();
            onAction?.();
          }}
          className="gap-2 w-full font-bold"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sign Out
        </Button>
        {/* <Button asChild size="sm" className="shadow-lg gap-2 w-full font-bold">
          <Link href="/admin/performance" onClick={onAction}>
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Portal
            Hub
          </Link>
        </Button> */}
      </div>
    );
  }
  return (
    <div
      className={cn("flex items-center gap-2", isMobile && "flex-col w-full")}
    >
      <Button asChild variant="outline" size="sm" className="w-full font-bold">
        <Link href="/onboarding" onClick={onAction}>
          Start Onboarding
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="shadow-md w-full font-bold"
            aria-label="Institutional login simulator"
          >
            Simulation Login
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground pb-2 border-b">
            Select Simulation Profile
          </DropdownMenuLabel>
          <div className="pt-2">
            <DropdownMenuItem
              onClick={() => {
                authService.setRole("phase1");
                window.location.href = "/dashboard";
              }}
              className="py-3 px-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Institutional Investor</span>
                <span className="text-[10px] text-muted-foreground">
                  Full portfolio & capital ops access
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                authService.setRole("phase2");
                window.location.href = "/phase2/dashboard";
              }}
              className="py-3 px-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Private SPVs</span>
                <span className="text-[10px] text-muted-foreground">
                  Command center & compliance management
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                authService.setRole("phase3");
                window.location.href = "/phase3/dashboard";
              }}
              className="py-3 px-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Strategic Operators</span>
                <span className="text-[10px] text-muted-foreground">
                  ESG & audit trail focus
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                authService.setRole("admin");
                window.location.href = "/admin/dashboard";
              }}
              className="py-3 px-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Admin</span>
                <span className="text-[10px] text-muted-foreground">
                  Admin dashboard
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                authService.setRole("compliance");
                window.location.href = "/admin/dashboard";
              }}
              className="py-3 px-4"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Compliance</span>
                <span className="text-[10px] text-muted-foreground">
                  This is Compliance
                </span>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
