'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { NAVIGATION, type NavItem } from '@/lib/constants/navigation';
import { useAccess } from '@/lib/authz/useAccess';
import { useAuthzVersion } from '@/lib/authz/version';
import type { UserRole } from '@/lib/types/auth.types';

interface SidebarLinkProps {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
}

/**
 * Legacy per-item role list from lib/constants/navigation.ts. Retained for external items
 * (which have no console route to look up) and as documentation of original intent.
 */
function hasAccess(item: NavItem, role?: UserRole): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  return role ? item.roles.includes(role) : false;
}

/** Nav hrefs carry query strings (/identity?tab=risk); policy matches on pathname. */
const toPathname = (href: string): string => href.split(/[?#]/)[0];

/**
 * Whether to show a nav item.
 *
 * The route policy is authoritative, so the sidebar can never advertise a section that the
 * route gate would then refuse — the two now read the same rules. This is deliberately
 * broader than the old per-item lists in one respect: those named roles literally
 * (['super_admin','admin']), silently hiding sections from `owner` even though the backend
 * hierarchy grants owner MORE than admin and would have served the request.
 */
function useNavVisibility() {
  const { checkRoute } = useAccess();
  const user = useAuthStore((s) => s.user);
  const authzVersion = useAuthzVersion();

  return (item: NavItem): boolean => {
    // Legacy mode: the original per-item role lists decide visibility, nothing else.
    if (authzVersion === 'old') return hasAccess(item, user?.role);

    const isExternal = item.external || /^https?:\/\//.test(item.href);
    if (isExternal) return hasAccess(item, user?.role);
    return checkRoute(toPathname(item.href)).allowed;
  };
}

function SidebarLink({ item, collapsed, depth = 0 }: SidebarLinkProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => item.children?.some((c) => pathname.startsWith(c.href)) ?? false);
  const isVisible = useNavVisibility();

  if (!isVisible(item)) return null;

  const IconComp = Icons[item.iconName as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined;
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={collapsed ? item.title : undefined}
          aria-expanded={open}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            open && 'text-sidebar-foreground',
            collapsed && 'justify-center px-2',
          )}
        >
          {IconComp && <IconComp className="h-4 w-4 shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 border-l border-sidebar-border pl-2">
            {item.children!.map((child) => (
              <SidebarLink key={child.href} item={child} collapsed={false} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isExternal = item.external || /^https?:\/\//.test(item.href);
  const linkClassName = cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    collapsed && 'justify-center px-2',
  );
  const linkInner = (
    <>
      {IconComp && <IconComp className="h-4 w-4 shrink-0" />}
      {!collapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {item.badge}
            </Badge>
          )}
          {isExternal && <Icons.ExternalLink className="h-3 w-3 shrink-0 opacity-40" />}
        </>
      )}
    </>
  );

  // Verticals that run as their own deployment open in a new tab.
  if (isExternal) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName}
        title={collapsed ? item.title : undefined}
      >
        {linkInner}
      </a>
    );
  }

  return (
    <Link href={item.href} className={linkClassName} title={collapsed ? item.title : undefined}>
      {linkInner}
    </Link>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed } = useUIStore();
  const isVisible = useNavVisibility();

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-[60px]' : 'w-64',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 items-center border-b border-sidebar-border px-4',
          sidebarCollapsed ? 'justify-center' : 'gap-2',
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary">
          <Icons.Shield className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-sidebar-foreground">Baalvion</span>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-6">
          {NAVIGATION.map((group) => {
            // Skip a whole group when the current role can't access any of its items,
            // so we never render a bare section header with no links beneath it.
            const visibleItems = group.items.filter(isVisible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                {!sidebarCollapsed && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <SidebarLink key={item.href} item={item} collapsed={sidebarCollapsed} />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
