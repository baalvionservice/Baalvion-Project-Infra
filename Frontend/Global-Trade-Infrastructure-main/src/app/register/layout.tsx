import type { Metadata } from 'next';

/**
 * @file register/layout.tsx
 * @description Server segment for public self-service registration. The page is a client
 * component (cannot export metadata), so this sibling layout carries the noindex directive.
 */
export const metadata: Metadata = {
  title: 'Create Account — Baalvion',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
