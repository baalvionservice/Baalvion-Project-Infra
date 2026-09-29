import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/signin/sign-in-form';
import { ROUTES } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Sign in',
  description: 'Secure passwordless sign-in for the Baalvion platform.',
  path: ROUTES.signin,
  noindex: true,
});

export default function SignInPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
