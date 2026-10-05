import type { Metadata } from 'next';
import Link from 'next/link';
import { Cpu, Settings2, Landmark, Megaphone, Handshake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Strategic Operator Program | Baalvion Leadership Team',
  description:
    'Baalvion is building its leadership team. Strategic Operators each own a function end to end across technology, operations, finance, growth and partnerships.',
  alternates: { canonical: '/strategic-operator' },
  openGraph: {
    title: 'Baalvion Strategic Operator Program',
    description: 'Join the leadership team building trusted digital infrastructure for global trade.',
    url: 'https://ir.baalvion.com/strategic-operator',
    type: 'website',
  },
};

const FUNCTIONS = [
  { icon: Cpu, title: 'Technology', body: 'Engineering, AI and machine learning, security, DevOps, and design for the Baalvion platforms.' },
  { icon: Settings2, title: 'Operations', body: 'Process, supply chain, legal and administrative operations that keep the platforms running.' },
  { icon: Landmark, title: 'Finance & Investor Relations', body: 'Financial planning, reporting, and the relationship with investors.' },
  { icon: Megaphone, title: 'Marketing & Growth', body: 'Brand, growth, public relations and communications.' },
  { icon: Handshake, title: 'Partnerships', body: 'Logistics, banking and trade-ecosystem partners that connect to the platform.' },
];

export default function StrategicOperatorPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <section className="bg-black text-white py-16 md:py-24 border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="text-sm font-bold text-primary tracking-[0.2em] mb-4 uppercase">Leadership</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Strategic Operator Program</h1>
            <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl">
              Baalvion is building the trusted digital infrastructure for global trade. We are assembling a leadership
              team of operators who each own one function end to end.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What a Strategic Operator does</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            A Strategic Operator is accountable for the results of a whole function, not a task list. They build the
            team, set the standard and report to the founders. Leadership roles are being filled one at a time, as the
            right people are found.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FUNCTIONS.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-neutral-200">
              <CardHeader>
                <Icon className="h-6 w-6 text-primary mb-3" />
                <CardTitle className="text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600 leading-relaxed">{body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y border-neutral-200">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Terms</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Terms for each role are agreed individually and in writing. Nothing on this page is an offer of shares or
            of any other security. To learn about the company and its leadership, see our{' '}
            <Link href="/governance/ownership" className="text-primary font-semibold hover:underline">ownership and control</Link>{' '}
            and{' '}
            <Link href="/governance/leadership" className="text-primary font-semibold hover:underline">leadership</Link>{' '}
            pages.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Introduce yourself</h2>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Tell us which function you would lead and what you have built before. We read every message.
        </p>
        <a
          href="mailto:hello@baalvion.com?subject=Strategic%20Operator%20Program"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-3 font-semibold text-black hover:opacity-90"
        >
          Write to us
        </a>
      </section>
    </div>
  );
}
