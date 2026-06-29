import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { CONTACT, ROUTES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Account access & recovery',
  description:
    'Regain access to your Baalvion account. Sign-in is passwordless, so there is no password to reset — request a fresh one-time code by email to get back in.',
  robots: { index: false, follow: false },
};

const STEPS = [
  'Go to sign in and enter the email address on your account.',
  'We email you a fresh one-time code. There is no password to reset.',
  'Enter the code to verify it is you, and you are back in across Baalvion.',
] as const;

export default function RecoveryPage() {
  return (
    <AuthShell>
      <section className="w-full max-w-md border hairline bg-surface p-8">
        <p className="mono-label mb-3 text-accent">Baalvion · Account recovery</p>
        <h1 className="display-h3 mb-2 text-foreground">Lost access to your account?</h1>
        <p className="mb-6 text-sm leading-relaxed text-muted">
          Baalvion is passwordless — we never set or store a password, so there is nothing to
          reset. To regain access, request a new one-time sign-in code by email.
        </p>

        <ol className="mb-7 space-y-4">
          {STEPS.map((step, i) => (
            <li key={step.slice(0, 20)} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center bg-ink-deep text-xs font-semibold text-accent"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <Link
          href={ROUTES.signin}
          className="block h-11 w-full bg-accent text-center text-sm font-medium leading-[2.75rem] text-ink-deep transition-colors duration-200 hover:bg-accent-ink"
        >
          Request a sign-in code
        </Link>

        <p className="mt-5 text-center text-xs leading-relaxed text-muted-2">
          No longer have access to that email address? Contact{' '}
          <a href={`mailto:${CONTACT.support}`} className="text-accent hover:text-accent-ink">
            {CONTACT.support}
          </a>{' '}
          and our team will help verify your identity.
        </p>
      </section>
    </AuthShell>
  );
}
