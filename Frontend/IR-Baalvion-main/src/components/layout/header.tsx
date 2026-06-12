"use client";

import { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Menu,
  Loader2,
  LogOut,
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
import { LoginModal } from "@/components/auth/LoginModal";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItem[]>([]);
  const [userRole, setUserRole] = useState<UserRole>("public");
  const [isLoading, setIsLoading] = useState(true);

  // Auto-open the login modal when the middleware bounced an unauthenticated user
  // to "/?login=1&next=…".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("login") === "1") {
      setIsLoginOpen(true);
    }
  }, []);

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
              <Link
                href="/invest"
                className="ml-1 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              >
                Invest
              </Link>
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
              <AuthButtons userRole={userRole} onLogin={() => setIsLoginOpen(true)} />
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
                <div className="flex flex-col h-[calc(100dvh-73px)]">
                  <nav
                    className="flex-1 overflow-y-auto overscroll-contain py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
                    aria-label="Mobile Navigation"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 px-6 py-4 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                        <span>Loading menu…</span>
                      </div>
                    ) : (
                      <MobileNav items={navItems} onLinkClick={closeSheet} />
                    )}
                  </nav>
                  <div className="p-6 border-t bg-muted/5">
                    <AuthButtons
                      userRole={userRole}
                      isMobile
                      onAction={closeSheet}
                      onLogin={() => {
                        closeSheet();
                        setIsLoginOpen(true);
                      }}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <AlertsSidebar open={isAlertsOpen} onOpenChange={setIsAlertsOpen} />
      <LoginModal open={isLoginOpen} onOpenChange={setIsLoginOpen} />
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

// Mobile navigation: collapsible accordion groups so the menu stays short and scannable
// instead of dumping every child of every section into one long flat list. Single-open
// (tapping a group collapses the others); the group containing the current route opens
// by default. Standalone top-level links render above the accordion.
function MobileNav({
  items,
  onLinkClick,
}: {
  items: NavigationItem[];
  onLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const groups = items.filter((i) => i.children && i.children.length > 0);
  const standalone = items.filter((i) => !i.children || i.children.length === 0);

  const activeGroup = groups.find((g) =>
    g.children?.some((c) => c.href && c.href === pathname)
  );
  const defaultValue = activeGroup?.id ?? groups[0]?.id;

  return (
    <div className="px-3 pb-4">
      <Link
        href="/invest"
        onClick={onLinkClick}
        className={cn(
          'mb-1 flex items-center justify-between rounded-lg px-3 py-3 text-base font-bold transition-colors',
          pathname?.startsWith('/invest') ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
        )}
      >
        Invest
        <ChevronRight className="h-4 w-4" />
      </Link>
      {standalone.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.id}
            href={item.href || "#"}
            onClick={onLinkClick}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-3 text-base font-semibold transition-colors",
              active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        );
      })}

      <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full">
        {groups.map((group) => {
          const hasActiveChild = group.children?.some(
            (c) => c.href && c.href === pathname
          );
          return (
            <AccordionItem key={group.id} value={group.id} className="border-b-0">
              <AccordionTrigger
                className={cn(
                  "rounded-lg px-3 py-3 text-[11px] font-bold uppercase tracking-[0.18em] hover:no-underline",
                  hasActiveChild
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {group.label}
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                <div className="flex flex-col gap-0.5 border-l border-border/60 pl-2 ml-3">
                  {group.children?.map((child) => (
                    <MobileNavChild
                      key={child.id}
                      child={child}
                      pathname={pathname}
                      onLinkClick={onLinkClick}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function MobileNavChild({
  child,
  pathname,
  onLinkClick,
}: {
  child: NavigationItem;
  pathname: string;
  onLinkClick?: () => void;
}) {
  if (child.isHeader) {
    return (
      <p className="px-3 pb-1 pt-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70">
        {child.label}
      </p>
    );
  }
  if (child.label === "---") {
    return <div className="my-1.5 mr-3 border-t border-border/60" aria-hidden="true" />;
  }
  const active = pathname === child.href;
  return (
    <Link
      href={child.href || "#"}
      onClick={onLinkClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      <span>{child.label}</span>
      <ChevronRight
        className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "opacity-30")}
        aria-hidden="true"
      />
    </Link>
  );
}

function AuthButtons({ userRole, isMobile, onAction, onLogin }: any) {
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
      <Button
        size="sm"
        className="shadow-md w-full font-bold"
        onClick={() => onLogin?.()}
      >
        Sign In
      </Button>
    </div>
  );
}
