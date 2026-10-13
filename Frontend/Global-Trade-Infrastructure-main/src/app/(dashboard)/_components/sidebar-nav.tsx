/**
 * @file sidebar-nav.tsx
 * @description The main menu. Role-aware and grouped. Full labels on desktops and in the phone menu;
 * icons only in the slim rail used on tablets.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppState } from './app-state';
import { useWorkspaceStore } from '@/modules/workspace/store/workspace-store';
import { ROUTE_REGISTRY, RouteMetadata, RouteCategory, CATEGORY_ORDER } from '@/core/routes';
import { getPersona, personaAllowsPath } from '@/core/personas';
import { orgTypeAllowsPath } from '@/core/organizations';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Sections expanded by default — the high-traffic operational + governance ones. The rest stay
// collapsed (one click to open) so the rail is scannable, not a wall of links.
const DEFAULT_OPEN: RouteCategory[] = ['COMMAND', 'MARKETPLACE', 'EXECUTION', 'FINANCE', 'GOVERNANCE'];

interface SidebarNavProps {
  collapsed?: boolean;
}

export function SidebarNav({ collapsed }: SidebarNavProps) {
  const pathname = usePathname();
  const { role, orgType, isPlatformAdmin } = useAppState();
  const { addTab } = useWorkspaceStore();

  // Navigation is scoped to the ORGANIZATION TYPE: each org type sees only the modules curated for
  // its surface. Platform-level authorities (super_admin / platform_owner) see the full registry.
  // Legacy sessions with no org type fall back to the persona allowlist.
  const persona = getPersona(role);
  const visibleRoutes = ROUTE_REGISTRY.filter((route) =>
    isPlatformAdmin
      ? true
      : orgType
        ? orgTypeAllowsPath(orgType, route.path)
        : personaAllowsPath(persona, route.path)
  );

  const byCategory = (cat: RouteCategory): RouteMetadata[] =>
    visibleRoutes.filter((r) => r.category === cat);

  const handleNavClick = (route: RouteMetadata) => {
    addTab({ id: route.path, title: route.label, path: route.path });
  };

  // Only render sections that actually have visible routes — never an empty header.
  const sections = CATEGORY_ORDER
    .map((c) => ({ ...c, items: byCategory(c.key) }))
    .filter((s) => s.items.length > 0);

  // Slim rail (tablets, or when the user collapsed the menu): icons only. Each one keeps its name
  // for screen readers and for a hover/long-press hint, and sections become thin dividers.
  if (collapsed) {
    return (
      <nav aria-label="Main menu" className="flex h-full flex-col items-center gap-1 overflow-y-auto px-2 py-4">
        {sections.map((section, i) => (
          <div key={section.key} className={cn('flex w-full flex-col items-center gap-1', i > 0 && 'mt-2 border-t pt-2')}>
            {section.items.map((route) => {
              const isActive = pathname === route.path;
              return (
                <Link
                  key={route.path}
                  href={route.path || '#'}
                  onClick={() => handleNavClick(route)}
                  aria-label={route.label}
                  aria-current={isActive ? 'page' : undefined}
                  title={route.label}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <route.icon aria-hidden className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Main menu" className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <Accordion type="multiple" defaultValue={DEFAULT_OPEN} className="w-full space-y-1">
          {sections.map((section) => (
            <AccordionItem value={section.key} key={section.key} className="border-none">
              <AccordionTrigger className="min-h-11 rounded-lg px-3 py-2 hover:bg-accent hover:no-underline">
                <span className="text-sm font-semibold text-foreground">{section.label}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0.5">
                <ul className="grid gap-0.5">
                  {section.items.map((route) => {
                    const isActive = pathname === route.path;
                    return (
                      <li key={route.path}>
                        <Link
                          href={route.path || '#'}
                          onClick={() => handleNavClick(route)}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
                            isActive
                              ? 'bg-primary font-medium text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          <route.icon aria-hidden className="h-5 w-5 shrink-0" />
                          <span className="truncate">{route.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </nav>
  );
}
