import Link from 'next/link';
import { Container } from '@/components/ui';
import { ForgotPasswordForm } from './forgot-form';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Reset your password');

export default function ForgotPasswordPage() {
  return (
    <Container width="prose" className="py-16">
      <h1 className="heading text-3xl">Reset your password</h1>
      <p className="mt-3 text-muted">
        Enter the address you signed up with and we will send a link to set a new password.
      </p>
      <div className="mt-8"><ForgotPasswordForm /></div>
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </Container>
  );
}