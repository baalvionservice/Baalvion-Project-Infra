import Link from 'next/link';
import { Card, CardBody, Container } from '@/components/ui';
import { SITE } from '@/lib/site';
import { RegisterForm } from './register-form';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('Create an account');

export default function RegisterPage() {
  return (
    <Container width="prose" className="py-16">
      <h1 className="heading text-3xl">Create an account</h1>
      <p className="mt-3 text-muted">
        Creating an account publishes nothing. Everything you write afterwards starts private.
      </p>

      <div className="mt-8"><RegisterForm /></div>

      <div className="mt-10 space-y-4">
        <Card>
          <CardBody>
            <h2 className="heading text-base">Your account is separate from your case</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {SITE.name} itself holds no email address, no password and no contact details — sign-in
              is handled by the wider Baalvion identity service, and this platform only ever sees an
              anonymous account reference.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="heading text-base">You choose what anyone can see</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Profiles are not discoverable until you turn that on, your location stays hidden by
              default, and every case you open starts private.
            </p>
          </CardBody>
        </Card>
      </div>

      <p className="mt-8 text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="focus-ring rounded-sm font-medium text-accent-strong underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </Container>
  );
}