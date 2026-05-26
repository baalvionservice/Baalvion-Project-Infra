'use client';

import { PanelLeft, Search, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store/uiStore';
import BreadcrumbNav from './BreadcrumbNav';
import NotificationDropdown from './NotificationDropdown';
import OrganizationSwitcher from './OrganizationSwitcher';
import UserMenu from './UserMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TopBar() {
  const { toggleSidebar, setCommandPaletteOpen } = useUIStore();
  const { setTheme } = useTheme();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
        <PanelLeft className="h-4 w-4" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <BreadcrumbNav />

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex gap-2 text-muted-foreground w-48 justify-start"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-auto text-xs bg-muted rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationDropdown />
        <OrganizationSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
