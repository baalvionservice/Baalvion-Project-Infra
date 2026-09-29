import type { Metadata } from 'next';
import Link from 'next/link';
import { IR_EMAIL, LEGAL_ENTITY_NAME } from '@baalvion/company';

export const metadata: Metadata = {
  title: 'Access by Invitation | Baalvion Investor Relations',
  description: 'Investor access to the Baalvion private placement funnel is by invitation.',
  alternates: { canonical: '/invest/request-access' },
};

// Where the middleware sends an uninvited visitor. It states the constraint and gives a contact
// route — it makes no offer, quotes no terms and asks for nothing beyond an email.
export default function RequestAccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-6 py-20">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">Investor Relations</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Access is by invitation</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        {LEGAL_ENTITY_NAME} is a private limited company. Investment opportunities are offered by
        private placement to identified persons only and are not offered to the public, so this
        part of the site is not open access.
      </p>
      <p className="mt-4 text-lg text-muted-foreground">
        If you have received an invitation, use the link it contains. Otherwise, write to investor
        relations and we will respond directly.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <a
          href={`mailto:${IR_EMAIL}`}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Contact Investor Relations
        </a>
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">
          Return to Investor Relations
        </Link>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        Are you a company looking to raise?{' '}
        <Link href="/invest/list-your-business" className="font-semibold text-primary hover:underline">
          List your business
        </Link>
        .
      </p>
    </main>
  );
}
