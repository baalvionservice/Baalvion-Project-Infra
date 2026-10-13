'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ROUTE_REGISTRY } from '@/core/routes';

/**
 * Screen readers and search use a page's one top-level heading to say where you are. The shell no
 * longer supplies one (the top bar is not a heading), so a page that has not been given its own
 * heading would have none. This adds a visually hidden one, named after the page, only when the
 * page has no heading of its own, so pages that do have one are never given a second.
 */
export function PageHeadingFallback({ containerId }: { containerId: string }) {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    setTitle(null);
    // Wait a beat so the page has rendered, then look for its own heading.
    const t = setTimeout(() => {
      const root = document.getElementById(containerId);
      if (!root || root.querySelector('h1')) return;
      const route = ROUTE_REGISTRY.find((r) => r.path === pathname);
      setTitle(route?.label ?? (document.title.split('|')[0].trim() || 'Page'));
    }, 600);
    return () => clearTimeout(t);
  }, [pathname, containerId]);

  return title ? <h1 className="sr-only">{title}</h1> : null;
}
