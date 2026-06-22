import type { Metadata } from 'next';

/**
 * @file verify-phone/layout.tsx
 * @description Server segment for the post-signup phone-verification step. The page is a client
 * component (cannot export metadata), so this sibling layout carries the noindex directive.
 */
export const metadata: Metadata = {
  title: 'Verify Phone — Baalvion',
  robots: { index: false, follow: false },
};

export default function VerifyPhoneLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
