import type { ReactNode } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui';
import { MODERATION_NAV } from '@/lib/nav';

/**
 * The moderator shell.
 *
 * Deliberately separate from /admin. A moderator reviews reports and moderates content;
 * they do not administer users, grant roles or read the audit trail. Keeping the two
 * sections apart makes that boundary visible rather than a matter of which links happen to
 * render — and each page below still meets its own server-side check.
 */
export default function ModerationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-line bg-surface">
        <Container>
          <div className="py-6">
            <h1 className="heading text-2xl">Moderation</h1>
            <p className="mt-1 text-sm text-muted">
              Keeping the environment safe. Every action is recorded with the reason it was taken.
            </p>
          </div>
          <nav aria-label="Moderation" className="-mb-px flex gap-1 overflow-x-auto">
            {MODERATION_NAV.map((item) => (
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
