import type { Metadata } from 'next';
import Link from 'next/link';
import { CIN, ENTITY_TYPE, INCORPORATED_ON, LEGAL_ENTITY_NAME } from '@baalvion/company';

export const metadata: Metadata = {
  title: 'Ownership & Control | Baalvion Industries Private Limited',
  description:
    'Who owns and directs Baalvion Industries Private Limited: the directors and the current shareholding of the founders.',
  alternates: { canonical: '/governance/ownership' },
  openGraph: {
    title: 'Baalvion Ownership & Control',
    description: 'The directors and founder shareholding of Baalvion Industries Private Limited.',
    url: 'https://ir.baalvion.com/governance/ownership',
    type: 'website',
  },
};

const incorporated = new Date(INCORPORATED_ON).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const SHAREHOLDERS = [
  { name: 'Deepak Kumar Kuldeep', note: 'Director and founder; publicly known as Allen Krewzz', share: '80%' },
  { name: 'Dilip Kumar Kuldeep', note: 'Director and co-founder', share: '20%' },
];

export default function OwnershipPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-black text-white py-16 md:py-24 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-sm font-bold text-primary tracking-[0.2em] mb-4 uppercase">Governance</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Ownership &amp; Control</h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl">
              Who owns and directs {LEGAL_ENTITY_NAME}, stated plainly.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">The company</h2>
        <dl className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
          {[
            ['Legal name', LEGAL_ENTITY_NAME],
            ['Type', `${ENTITY_TYPE}, India`],
            ['Incorporated', incorporated],
            ['CIN', CIN],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-4 py-4">
              <dt className="text-sm font-semibold text-gray-500">{k}</dt>
              <dd className="col-span-2 text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 text-2xl font-bold tracking-tight">Shareholding</h2>
        <p className="mt-3 text-gray-600 leading-relaxed">
          The current holders of the company&apos;s shares, as recorded in its register of members.
        </p>
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
          {SHAREHOLDERS.map((s) => (
            <div key={s.name} className="flex items-center justify-between gap-4 border-b border-neutral-200 p-5 last:border-b-0">
              <div>
                <p className="font-semibold text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">{s.note}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.share}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 text-2xl font-bold tracking-tight">Board</h2>
        <p className="mt-3 text-gray-600 leading-relaxed">
          The directors of the company are Deepak Kumar Kuldeep and Dilip Kumar Kuldeep. See the{' '}
          <Link href="/governance/leadership" className="text-primary font-semibold hover:underline">leadership page</Link>{' '}
          for the wider team.
        </p>

        <p className="mt-14 border-t border-neutral-200 pt-6 text-sm text-gray-500 leading-relaxed">
          Any future issue of shares is made only by private placement to identified persons, in accordance with the
          Companies Act, 2013. Nothing on this website is an offer, or an invitation to subscribe for, any security.
          To enquire about investing, use the{' '}
          <Link href="/invest/request-access" className="text-primary font-semibold hover:underline">request access</Link>{' '}
          page.
        </p>
      </section>
    </div>
  );
}
