/**
 * @file header.tsx
 * @description Standardized high-trust header for the Baalvion OS.
 * Hardened: Fixed Link href validation and institutional logout route.
 */
'use client';

import { BaalvionLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { Menu, Landmark, ChevronDown, Search, LogOut, User, FileText } from 'lucide-react';
import { useAppState } from './app-state';
import { SidebarNav } from './sidebar-nav';
import { getPersona, getPersonaHome } from '@/core/personas';
import { getOrgTypeLabel } from '@/core/organizations';
import { PATHS } from '@/lib/paths';
import { NotificationCenter } from '@/components/notification-center';
import { DemoControl } from './demo-control';
import { CommandPalette } from '@/components/command-palette';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceClass } from '@/hooks/use-device-class';
import { useCommandStore } from '@/modules/platform-command/store/command.store';

export function DashboardHeader() {
  const { role, orgType, isPlatformAdmin, setRole, availableRoles, logout, displayName } = useAppState();
  const { isHandheld } = useDeviceClass();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // The phone menu is a drawer over the page: close it once a page has been chosen.
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  // The search window (CommandPalette) reads THIS store. The button used to write to a different
  // one, so it never opened anything; only the keyboard shortcut worked.
  const setSearchOpen = useCommandStore((state) => state.setSearchOpen);

  const persona = getPersona(role);
  const PersonaIcon = persona.icon;
  // Identity label: the ORGANIZATION TYPE for tenant users, the persona for platform/legacy sessions.
  const identityLabel = orgType && !isPlatformAdmin ? getOrgTypeLabel(orgType) : persona.label;
  // Cross-console switching is a PLATFORM-administration privilege only (super_admin / platform_owner).
  // Every other authority is locked to its own console — no "become any role" lens in production.
  const canSwitchPersona = isPlatformAdmin;

  // Switching persona moves you into that persona's own console. The context's setRole is itself
  // gated (a non-god authority is a no-op), so this is defense-in-depth, not the only check.
  const switchPersona = (nextRole: typeof role) => {
    setRole(nextRole);
    router.push(getPersonaHome(nextRole));
  };

  const handleLogout = async () => {
    await logout();
    router.replace(PATHS.LOGIN || '/login');
  };

  // The simulation tools are for demonstrations only: they change shared platform records, so a
  // customer must never see them. They appear only where the deployment turns demo mode on, and
  // only for platform administrators.
  const showDemoTools = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && isPlatformAdmin;
  const initials = (displayName || persona.label)
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:gap-3 sm:px-4 lg:px-6">
      {isHandheld && (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="h-11 w-11 shrink-0 rounded-lg" aria-label="Open the menu">
              <Menu aria-hidden className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto p-0">
            <div className="grid h-full content-start">
              <div className="flex h-14 items-center border-b px-5">
                <Link href={PATHS.DASHBOARD || '/dashboard'} className="flex items-center gap-3">
                  <BaalvionLogo className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold tracking-tight">Baalvion</span>
                </Link>
              </div>
              <div className="p-3">
                <SidebarNav />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Who you are signed in as. The page below carries its own title, so this is not a heading. */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PersonaIcon aria-hidden className={cn('hidden h-6 w-6 shrink-0 sm:block', persona.accent)} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-semibold sm:text-lg">{identityLabel}</p>
          <p className="hidden truncate text-sm text-muted-foreground lg:block">{persona.tagline}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {showDemoTools && <div className="hidden 2xl:block"><DemoControl /></div>}

        <Button
          variant="outline"
          className="h-11 w-11 rounded-lg px-0 md:w-auto md:gap-2 md:px-4"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
        >
          <Search aria-hidden className="h-5 w-5 md:h-4 md:w-4" />
          <span className="hidden text-sm md:inline">Search</span>
          <kbd className="hidden rounded border px-1.5 text-xs text-muted-foreground lg:inline">Ctrl K</kbd>
        </Button>

        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-11 gap-2 rounded-lg px-2 sm:px-3" aria-label="Your account">
              <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials}</span>
              <span className="hidden max-w-[10rem] flex-col items-start leading-tight md:flex">
                <span className="w-full truncate text-sm font-medium">{displayName || persona.label}</span>
                <span className="w-full truncate text-xs text-muted-foreground">{persona.label}</span>
              </span>
              <ChevronDown aria-hidden className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-1.5rem)] rounded-xl p-2">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{displayName || persona.label}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{persona.label}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canSwitchPersona && (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">View the platform as</p>
                <div className="max-h-[40vh] overflow-y-auto">
                  {availableRoles.map((r) => (
                    <DropdownMenuItem key={r} onClick={() => switchPersona(r)} className="min-h-11 cursor-pointer rounded-lg px-3">
                      <Landmark aria-hidden className="mr-3 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-sm">{r}</span>
                      {role === r && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Current view" />}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="min-h-11 cursor-pointer rounded-lg px-3" onClick={() => router.push(PATHS.PROFILE)}>
              <User aria-hidden className="mr-3 h-4 w-4" /> <span className="text-sm">Your profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 cursor-pointer rounded-lg px-3" onClick={() => router.push(PATHS.DOCUMENTS)}>
              <FileText aria-hidden className="mr-3 h-4 w-4" /> <span className="text-sm">Your documents</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); void handleLogout(); }}
              className="min-h-11 cursor-pointer rounded-lg px-3 text-destructive focus:text-destructive"
            >
              <LogOut aria-hidden className="mr-3 h-4 w-4" /> <span className="text-sm font-medium">Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <CommandPalette />
    </header>
  );
}
