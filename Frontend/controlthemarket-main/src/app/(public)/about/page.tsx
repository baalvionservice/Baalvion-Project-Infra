import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Target, Scale, ShieldCheck, Zap, Quote, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'ControlTheMarket helps companies hire on proven skill, not resumes. Candidates do real, job-like work; teams hire on objective performance. Learn about our mission, values and team.',
  alternates: { canonical: absoluteUrl('/about') },
  openGraph: {
    url: absoluteUrl('/about'),
    title: 'About Us | ControlTheMarket',
    description: 'We help companies hire on proven skill, not resumes — with real, job-like work and objective performance data.',
  },
};

const stats = [
  { value: '2,400+', label: 'Companies hiring' },
  { value: '180,000+', label: 'Skills assessments run' },
  { value: '41%', label: 'Faster time-to-hire' },
  { value: '94%', label: 'Would hire this way again' },
];

const values = [
  { icon: Target, title: 'Proof over pedigree', body: 'A resume tells you where someone has been. A real task shows you what they can do. We score the work, not the wording.' },
  { icon: Scale, title: 'Fair by design', body: 'Every candidate gets the same brief and the same rubric. Structured, bias-aware scoring gives overlooked talent a real shot.' },
  { icon: ShieldCheck, title: 'Trust through transparency', body: 'Companies see exactly how a score was reached. Candidates keep a portfolio of verified work they own and can reuse.' },
  { icon: Zap, title: 'Hire in days, not months', body: 'Send a task, review ranked submissions, make an offer. Teams cut weeks of screening calls down to a single afternoon.' },
];

const team = [
  { name: 'Maya Rodriguez', role: 'Co-founder & CEO', avatar: 'https://picsum.photos/seed/ctm-maya/120/120' },
  { name: 'David Chen', role: 'Co-founder & CTO', avatar: 'https://picsum.photos/seed/ctm-david/120/120' },
  { name: 'Aisha Okafor', role: 'VP of Product', avatar: 'https://picsum.photos/seed/ctm-aisha/120/120' },
  { name: 'Liam Walsh', role: 'Head of Talent Science', avatar: 'https://picsum.photos/seed/ctm-liam/120/120' },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Our story</p>
            <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight md:text-6xl">
              Hiring should be decided by proof, not resumes.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              ControlTheMarket replaces guesswork with evidence. Candidates complete short, job-like tasks; companies
              hire on objective, side-by-side performance. The result is faster, fairer hiring — and teams that perform
              from day one.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg"><Link href="/signup/company">Start hiring</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/companies">See who&apos;s hiring</Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b">
        <div className="container py-10">
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">{s.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="container py-16 md:py-24">
        {/* Story */}
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border">
            <Image src="https://picsum.photos/seed/ctm-team/700/520" alt="The ControlTheMarket team at work" fill style={{ objectFit: 'cover' }} />
          </div>
          <div>
            <h2 className="font-headline text-3xl font-bold">Why we built this</h2>
            <p className="mt-4 text-muted-foreground">
              We were hiring managers ourselves — and tired of resumes that said everything and proved nothing. Great
              builders were getting filtered out by keywords, while polished CVs sailed through to roles they couldn&apos;t do.
            </p>
            <p className="mt-4 text-muted-foreground">
              So we flipped the process. Instead of asking people what they&apos;ve done, we let them show it: a focused,
              realistic task, scored against a consistent rubric. Today thousands of teams use ControlTheMarket to make
              their hardest hires with confidence — and tens of thousands of candidates have been hired on the strength
              of their work, not their wording.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight">What we stand for</h2>
            <p className="mt-4 text-muted-foreground">The principles behind every assessment, ranking and hire on the platform.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <Card key={v.title} className="h-full">
                <CardContent className="pt-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <v.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <figure className="mx-auto mt-24 max-w-3xl rounded-2xl border bg-muted/30 p-8 text-center md:p-12">
          <Quote className="mx-auto h-8 w-8 text-primary" />
          <blockquote className="mt-4 font-headline text-xl font-medium leading-relaxed md:text-2xl">
            &ldquo;We replaced three rounds of screening calls with one task on ControlTheMarket. Our time-to-hire dropped
            from six weeks to nine days, and the people we hired are measurably stronger.&rdquo;
          </blockquote>
          <figcaption className="mt-6 flex items-center justify-center gap-3">
            <Avatar className="h-10 w-10"><AvatarImage src="https://picsum.photos/seed/ctm-priya/80/80" /><AvatarFallback>PN</AvatarFallback></Avatar>
            <div className="text-left">
              <div className="text-sm font-semibold">Priya Nair</div>
              <div className="text-sm text-muted-foreground">VP Talent, Northwind Labs</div>
            </div>
          </figcaption>
        </figure>

        {/* Team */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight">Meet the team</h2>
            <p className="mt-4 text-muted-foreground">Engineers, recruiters and behavioural scientists fixing the most important decision a company makes.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="pt-6">
                  <Avatar className="mx-auto mb-4 h-24 w-24">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="font-headline text-3xl font-bold">Hire your next role on proof.</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Start free — no credit card required. Post a task today and review your first ranked submissions this week.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary"><Link href="/signup/company">Get started free <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><Link href="/pricing">View pricing</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
