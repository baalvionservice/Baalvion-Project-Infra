'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { DocsSection } from '@/lib/nav';

export function DocsSidebar({ section, onNavigate }: { section: DocsSection; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label={section.label} className="flex flex-col gap-6 nav-scroll">
      {section.groups.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-2">{group.title}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={isActive ? 'page' : undefined}
                    className={`focus-ring block rounded-md px-3 py-1.5 text-sm transition ${
                      isActive
                        ? 'bg-accent/10 font-medium text-accent-strong'
                        : 'text-muted hover:bg-surface-2 hover:text-foreground'
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
