import type { Metadata } from 'next';

// Authentication pages (login, register, etc.) are transactional, not content —
// never index or follow. robots.ts also disallows /login and /register; this
// segment-level directive enforces noindex for the whole (auth) group.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout is for authentication pages like login, signup, etc.
  // It should not contain any protected route logic to avoid redirect loops.
  return <>{children}</>;
}
