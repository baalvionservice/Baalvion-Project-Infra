import type { Metadata } from 'next';

// Private client-inquiry surface — never index or follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function InquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
