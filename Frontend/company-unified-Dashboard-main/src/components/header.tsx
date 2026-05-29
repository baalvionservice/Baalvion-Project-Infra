"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Search,
  AlertTriangle,
  DollarSign,
  Settings,
  Users,
  Briefcase,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { dashboardApi } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/lib/types";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import TrialBanner from "./trial-banner";
import RateLimitBanner from "./rate-limit-banner";
import OfflineBanner from "./offline-banner";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const notificationIcons: Record<NotificationType, React.ElementType> = {
  Alert: AlertTriangle,
  Finance: DollarSign,
  System: Settings,
  Team: Users,
};

const notificationColors: Record<NotificationType, string> = {
  Alert: "text-red-500",
  Finance: "text-green-500",
  System: "text-blue-500",
  Team: "text-purple-500",
};

// Map a live dashboard-service notification row to the shape the header renders.
interface HeaderNotification { id: string; type: NotificationType; title: string; description: string; timestamp: string; isRead: boolean }
const NOTIF_TYPE_MAP: Record<string, NotificationType> = { alert: "Alert", finance: "Finance", system: "System", team: "Team", info: "System" };
function mapNotification(n: Record<string, unknown>): HeaderNotification {
  return {
    id: String(n.id),
    type: NOTIF_TYPE_MAP[String(n.type ?? "").toLowerCase()] ?? "System",
    title: String(n.title ?? ""),
    description: String(n.message ?? n.description ?? ""),
    timestamp: String(n.createdAt ?? n.timestamp ?? new Date().toISOString()),
    isRead: Boolean(n.read ?? n.isRead),
  };
}

function DemoBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("baalvion_demo_mode") === "true"
    ) {
      setIsDemoMode(true);
    }
  }, []);

  const handleExitDemo = () => {
    localStorage.removeItem("baalvion_demo_mode");
    router.push("/onboarding");
  };

  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-center gap-4 bg-orange-500 p-2 text-sm font-semibold text-white">
      <span>DEMO MODE</span>
      <Button
        variant="outline"
        size="sm"
        className="h-6 border-orange-300 bg-orange-500 text-white hover:bg-orange-600 hover:text-white"
        onClick={handleExitDemo}
      >
        Exit Demo & Start Setup
      </Button>
    </div>
  );
}

export function Header() {
  const { businesses: businessesData } = useDashboardRefs();
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await dashboardApi.notifications();
        const list = (((res as { data?: unknown[] })?.data ?? res ?? []) as Record<string, unknown>[]);
        if (!cancelled) setNotifications(list.map(mapNotification));
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);
  const latestNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedBusiness = searchParams.get("businessId") || "all";

  const [showSearchTooltip, setShowSearchTooltip] = useState(false);
  const [showBellTooltip, setShowBellTooltip] = useState(false);

  useEffect(() => {
    const isDemo = localStorage.getItem("baalvion_demo_mode") === "true";
    if (isDemo) return;

    const hasSeenSearch = localStorage.getItem("hasSeenSearchTooltip");
    if (!hasSeenSearch) {
      const timer = setTimeout(() => {
        setShowSearchTooltip(true);
        const hideTimer = setTimeout(() => {
          setShowSearchTooltip(false);
          localStorage.setItem("hasSeenSearchTooltip", "true");
        }, 5000);
        return () => clearTimeout(hideTimer);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const isDemo = localStorage.getItem("baalvion_demo_mode") === "true";
    if (isDemo) return;

    const hasSeenBell = localStorage.getItem("hasSeenBellTooltip");
    if (!hasSeenBell) {
      const timer = setTimeout(() => {
        setShowBellTooltip(true);
        const hideTimer = setTimeout(() => {
          setShowBellTooltip(false);
          localStorage.setItem("hasSeenBellTooltip", "true");
        }, 2000); // Stagger the tooltips
        return () => clearTimeout(hideTimer);
      }, 2000); // Stagger the tooltips
      return () => clearTimeout(timer);
    }
  }, []);

  const handleBusinessChange = (businessId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (businessId === "all") {
      params.delete("businessId");
    } else {
      params.set("businessId", businessId);
    }
    // when switching business, go to dashboard
    router.push(`/dashboard?${params.toString()}`);
  };

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("open-search"));
  };

  return (
    <div className="sticky top-0 z-30 flex flex-col items-stretch bg-background sm:static sm:h-auto sm:border-0 sm:bg-transparent no-print">
      <DemoBanner />
      <TrialBanner />
      <RateLimitBanner />
      <OfflineBanner />
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <SidebarTrigger className="hidden sm:flex" />
        <div className="flex w-full justify-between items-center gap-2 md:gap-4">
          
          <Select value={selectedBusiness} onValueChange={handleBusinessChange}>
            <SelectTrigger className="w-full max-w-[150px] min-w-44  sm:max-w-[180px] md:w-[280px]">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0" />
                <SelectValue placeholder="Select Business" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Businesses</SelectItem>
              {businessesData.map((biz) => (
                <SelectItem key={biz.id} value={biz.id}>
                  {biz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <div className="relative ml-auto flex flex-1 items-center gap-2 md:grow-0">
              <Tooltip open={showSearchTooltip}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-muted-foreground md:w-[200px] lg:w-[320px]"
                    onClick={openSearch}
                  >
                    <Search className="h-4 w-4 mr-2 shrink-0" />
                    <span className="hidden sm:inline">Search...</span>
                    <span className="sm:hidden">Search</span>
                    <kbd className="ml-auto pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Search across all businesses, employees, and transactions
                  </p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip open={showBellTooltip}>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9"
                      >
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                        {unreadCount > 0 && (
                          <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {unreadCount}
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>We'll notify you here when something needs attention</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="end"
                  className="w-80 sm:w-96 max-w-[calc(100vw-2rem)]"
                >
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                    {latestNotifications.map((notification) => {
                      const Icon =
                        notificationIcons[
                          notification.type as NotificationType
                        ];
                      return (
                        <DropdownMenuItem key={notification.id} asChild>
                          <Link
                            href="/notifications"
                            className="flex items-start gap-3 !p-2"
                          >
                            <Icon
                              className={cn(
                                "mt-1 h-4 w-4 shrink-0",
                                notificationColors[
                                  notification.type as NotificationType
                                ]
                              )}
                            />
                            <div className="flex-1 space-y-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(notification.timestamp),
                                  { addSuffix: true }
                                )}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0"></div>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/notifications"
                      className="w-full justify-center text-sm font-medium text-primary hover:text-primary/90"
                    >
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
          <UserNav />
        </div>
      </header>
    </div>
  );
}
