import type { Metadata } from 'next';
import { SignInForm } from '@/components/signin/sign-in-form';

export const metadata: Metadata = {
  title: 'Sign in · Baalvion',
  description: 'Secure passwordless sign-in for the Baalvion platform.',
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink px-4 py-20">
      <SignInForm />
    </main>
  );
}
