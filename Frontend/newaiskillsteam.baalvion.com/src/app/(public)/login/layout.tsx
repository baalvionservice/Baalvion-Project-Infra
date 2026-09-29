import type { Metadata } from 'next';

// Authentication surface — keep out of the index.
export const metadata: Metadata = {
  title: 'Log In',
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
