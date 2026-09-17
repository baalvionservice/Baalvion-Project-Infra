import type { Metadata } from 'next';

// Sign-up and onboarding flow — authenticated/conversion funnel, keep out of the index.
export const metadata: Metadata = {
  title: 'Sign Up',
  robots: { index: false, follow: false },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
