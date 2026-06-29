import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/signin/sign-in-form';

export const metadata: Metadata = {
  title: 'Create your account',
  description:
    'Create a Baalvion account. Registration is passwordless — enter your details and verify your email with a one-time code.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
