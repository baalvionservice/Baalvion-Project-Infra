import type { ReactNode } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui';
import { ADMIN_NAV } from '@/lib/nav';

/**
 * The administrative shell — chrome, not a guard.
 *
 * Every page beneath it fetches from an endpoint that enforces its own permission, and a
 * member who navigates here gets a 403 from the API rather than a blank screen. Hiding the
 * navigation would be presentation, not security. The moderator-facing work lives at
 * /moderation instead, so the two tiers stay visibly distinct.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container>
          <div className="py-6">
            <h1 className="heading text-2xl">Administration</h1>
            <p className="mt-1 text-sm text-muted">
              Platform operations. Every action here is recorded in the audit trail.
            </p>
          </div>
          <nav aria-label="Administration" className="-mb-px flex gap-1 overflow-x-auto">
            {ADMIN_NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className="focus-ring whitespace-nowrap rounded-t-md border-b-2 border-transparent px-3 py-2.5 text-sm text-muted hover:border-line-strong hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      <Container className="py-8">{children}</Container>
    </>
  );
}
