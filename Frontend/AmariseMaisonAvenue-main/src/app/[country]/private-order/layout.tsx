import type { Metadata } from 'next';

// Private bespoke-order surface — never index or follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrivateOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
