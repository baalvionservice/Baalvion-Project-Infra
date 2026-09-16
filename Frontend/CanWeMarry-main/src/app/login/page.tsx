import { Suspense } from 'react';
import Link from 'next/link';
import { Container, LoadingState } from '@/components/ui';
import { LoginForm } from './login-form';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Sign in');

export default function LoginPage() {
  return (
    <Container width="prose" className="py-16">
      <h1 className="heading text-3xl">Sign in</h1>
      <p className="mt-3 text-muted">
        Your session is held in a secure cookie. No sign-in details are ever stored in your browser.
      </p>

      <div className="mt-8">
        {/* useSearchParams needs a boundary, or the whole route is forced dynamic. */}
        <Suspense fallback={<LoadingState label="Loading the sign-in form" rows={1} />}>
          <LoginForm />
        </Suspense>
      </div>

      <div className="mt-6 space-y-2 text-sm text-muted">
        <p>
          <Link href="/forgot-password" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
            Forgotten your password?
          </Link>
        </p>
        <p>
          Do not have an account?{' '}
          <Link href="/register" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
            Create one
          </Link>
        </p>
      </div>
    </Container>
  );
}