'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from './cn';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

/**
 * Tabs backed by the query string rather than component state.
 *
 * Each tab is a real link, so a view is shareable, the back button works, and the content
 * can be rendered on the server for the selected tab alone. A client-side tab that hid
 * already-fetched panels would mean sending every panel's data to every visitor — including
 * data they may not be entitled to.
 */
export function Tabs({ items, param = 'tab', label }: { items: TabItem[]; param?: string; label: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(param) ?? items[0]?.key;

  const href = (key: string) => {
    const q = new URLSearchParams(params.toString());
    if (key === items[0]?.key) q.delete(param); else q.set(param, key);
    q.delete('page');
    return `${pathname}${q.toString() ? `?${q}` : ''}`;
  };

  return (
    <nav aria-label={label} className="border-b border-line">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = current === item.key;
          return (
            <li key={item.key}>
              <Link
                href={href(item.key)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'border-accent font-medium text-accent-strong'
                    : 'border-transparent text-muted hover:border-line-strong hover:text-foreground',
                )}
              >
                {item.label}
                {typeof item.count === 'number' && (
                  <span className={cn('rounded-full px-1.5 text-xs tabular-nums', active ? 'bg-accent-soft text-accent-strong' : 'bg-surface-2 text-muted')}>
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
