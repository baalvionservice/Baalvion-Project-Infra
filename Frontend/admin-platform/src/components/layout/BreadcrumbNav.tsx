'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';

export default function BreadcrumbNav() {
  const { breadcrumbs } = useUIStore();

  if (!breadcrumbs.length) return null;

  return (
    <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {breadcrumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5" />
          {crumb.href ? (
            <Link
              href={crumb.href}
              className={
                i === breadcrumbs.length - 1
                  ? 'text-foreground font-medium'
                  : 'hover:text-foreground transition-colors'
              }
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
