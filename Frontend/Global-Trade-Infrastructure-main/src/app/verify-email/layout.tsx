import type { Metadata } from 'next';

/**
 * @file verify-email/layout.tsx
 * @description Server segment for the email-verification landing page. The page is a client
 * component (cannot export metadata), so this sibling layout carries the noindex directive.
 */
export const metadata: Metadata = {
  title: 'Verify Email — Baalvion',
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
