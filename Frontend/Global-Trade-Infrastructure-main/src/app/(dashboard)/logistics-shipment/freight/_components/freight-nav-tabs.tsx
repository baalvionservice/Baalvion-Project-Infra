'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/logistics-shipment/freight', label: 'Dashboard' },
  { href: '/logistics-shipment/freight/quotes', label: 'Quotes' },
  { href: '/logistics-shipment/freight/carriers', label: 'Marketplace' },
  { href: '/logistics-shipment/freight/carriers/manage', label: 'Carrier Management' },
  { href: '/logistics-shipment/freight/rate-engine', label: 'Rate Engine' },
  { href: '/logistics-shipment/freight/bookings', label: 'Bookings' },
  { href: '/logistics-shipment/freight/route-optimizer', label: 'Route Optimizer' },
  { href: '/logistics-shipment/freight/analytics', label: 'Analytics' },
  { href: '/logistics-shipment/freight/schedules', label: 'Schedules' },
  { href: '/logistics-shipment/freight/capacity', label: 'Capacity' },
];

/** Shared local sub-navigation across every /logistics-shipment/freight/* page. */
export function FreightNavTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px -mx-1 px-1">
      {TABS.map((tab) => {
        const active = tab.href === '/logistics-shipment/freight'
          ? pathname === tab.href
          : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'whitespace-nowrap px-3 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
