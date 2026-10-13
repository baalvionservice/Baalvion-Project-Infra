'use client';
import Link from 'next/link';
import { BaalvionLogo } from '@/components/icons';
import { SidebarNav } from './sidebar-nav';
import { PATHS } from '@/lib/paths';
import { cn } from '@/lib/utils';
import { useDeviceClass } from '@/hooks/use-device-class';

interface SidebarProps {
  collapsed?: boolean;
}

/**
 * @file sidebar.tsx
 * @description The side menu for screens 1024px wide and up: full labels, or a slim icon rail when
 * the user collapses it. Narrower screens use the drawer menu in the top bar.
 */
export function DashboardSidebar({ collapsed }: SidebarProps) {
  const { isHandheld } = useDeviceClass();

  // Phones and iPad portrait open the menu from the top bar instead.
  if (isHandheld) return null;

  return (
    <aside className={cn(
      "hidden lg:flex flex-col sticky top-0 h-dvh border-r bg-muted/40 transition-all duration-300 overflow-hidden",
      collapsed ? "w-20" : "w-full"
    )}>
      <div className={cn(
        "flex h-14 items-center border-b transition-all",
        collapsed ? "px-0 justify-center" : "px-6 lg:px-8"
      )}>
        <Link href={PATHS.DASHBOARD} className={cn("flex min-h-11 items-center gap-3", collapsed && "min-w-11 justify-center")} aria-label="Baalvion home">
          <BaalvionLogo className="h-7 w-7 text-primary" />
          {!collapsed && (
            <span className="font-semibold tracking-tight text-foreground text-lg">Baalvion</span>
          )}
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <SidebarNav collapsed={collapsed} />
      </div>
    </aside>
  );
}
