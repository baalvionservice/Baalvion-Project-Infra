import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignInForm } from '@/components/signin/sign-in-form';
import { ROUTES } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Create your account',
  description:
    'Create a Baalvion account. Registration is passwordless — enter your details and verify your email with a one-time code.',
  path: ROUTES.register,
  noindex: true,
});

export default function RegisterPage() {
  return (
    <AuthShell>
      <SignInForm />
    </AuthShell>
  );
}
