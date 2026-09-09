import { Suspense } from 'react';
import { privateMetadata } from '@/lib/seo';
import { Container, LoadingState } from '@/components/ui';
import { VerifyEmailForm } from './verify-form';

export const metadata = privateMetadata('Confirm your email');

export default function VerifyEmailPage() {
  return (
    <Container width="prose" className="py-section-lg">
      <h1 className="heading text-3xl">Confirm your email address</h1>
      <p className="mt-3 text-muted">
        Confirming your address helps us keep the community accountable, and lets us reach you
        if you lose access to your account.
      </p>
      <div className="mt-8">
        {/* useSearchParams needs a boundary or the whole route is forced dynamic. */}
        <Suspense fallback={<LoadingState label="Loading" rows={1} />}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </Container>
  );
}
