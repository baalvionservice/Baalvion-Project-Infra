'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/deals', label: 'Deal Rooms' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/onboarding', label: 'Verification' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-sm" style={{ color: 'var(--color-muted)' }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-1 border-r p-4" style={{ borderColor: 'var(--color-line)' }}>
        <Link href="/dashboard" className="mb-6 px-2 text-lg font-semibold tracking-tight">
          Baalvion<span style={{ color: 'var(--color-accent)' }}>Invest</span>
        </Link>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm transition"
              style={
                active
                  ? { background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }
                  : { color: 'var(--color-muted)' }
              }
            >
              {item.label}
            </Link>
          );
        })}
        <div className="mt-auto border-t pt-4" style={{ borderColor: 'var(--color-line)' }}>
          <div className="px-3 text-sm">{user.email}</div>
          <div className="px-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            {user.role}
          </div>
          <button onClick={logout} className="btn btn-ghost mt-3 w-full text-sm">
            Sign out
          </button>
        </div>
      </aside>
      <main className="overflow-y-auto p-8">{children}</main>
    </div>
  );
}
