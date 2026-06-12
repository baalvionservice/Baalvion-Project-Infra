import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppConfig } from '@/config/app.config';
import {
  Globe,
  Compass,
  Scale,
  Sparkles,
  Users,
  HeartHandshake,
  GraduationCap,
  Laptop,
  CalendarClock,
  Stethoscope,
  Plane,
  BookOpen,
  Trophy,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Life at Baalvion | Careers',
  description:
    'Discover the culture, values, and people behind Baalvion. We build the intelligent infrastructure for global talent — remote-first, merit-driven, and obsessed with craft. See how we work, what we believe, and the benefits we offer.',
  alternates: { canonical: '/careers/life-at-baalvion' },
  openGraph: {
    title: 'Life at Baalvion | TalentOS by Baalvion',
    description:
      'A remote-first, merit-driven culture where skill beats pedigree. Explore our values, the way we work, and the benefits behind Baalvion.',
    url: '/careers/life-at-baalvion',
  },
};

const values = [
  {
    icon: <Scale className="h-6 w-6 text-primary" />,
    title: 'Merit over pedigree',
    description:
      'We judge work by its impact, not by the logo on a résumé or the rank of a university. The best idea in the room wins, wherever it comes from.',
  },
  {
    icon: <Globe className="h-6 w-6 text-primary" />,
    title: 'Borderless by design',
    description:
      'Talent is everywhere; opportunity should be too. We hire across countries and build for a world where geography never caps potential.',
  },
  {
    icon: <Compass className="h-6 w-6 text-primary" />,
    title: 'Ownership, end to end',
    description:
      'You own outcomes, not tickets. We hand people real problems and the autonomy to solve them — then back them with context and trust.',
  },
  {
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    title: 'Craft is the standard',
    description:
      'We sweat the details others skip. Quality is not a phase at the end — it is how we work from the first commit to the final review.',
  },
  {
    icon: <HeartHandshake className="h-6 w-6 text-primary" />,
    title: 'Default to transparency',
    description:
      'Decisions, trade-offs, and reasoning are written down and shared. Clarity scales; politics do not.',
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: 'Win as a team',
    description:
      'We optimise for the company, not the org chart. Helping a teammate ship is as valued as shipping yourself.',
  },
];

const howWeWork = [
  {
    icon: <Laptop className="h-6 w-6 text-primary" />,
    title: 'Remote-first, async by default',
    description:
      'Work from wherever you do your best thinking. We write more than we meet, so progress never waits on a calendar.',
  },
  {
    icon: <CalendarClock className="h-6 w-6 text-primary" />,
    title: 'Deep work, protected',
    description:
      'Fewer meetings, longer focus blocks. We guard maker time and keep status theatre out of the day.',
  },
  {
    icon: <BookOpen className="h-6 w-6 text-primary" />,
    title: 'Decisions in the open',
    description:
      'Proposals are documented, debated, and recorded. Anyone can read why we chose what we chose — months or years later.',
  },
  {
    icon: <Trophy className="h-6 w-6 text-primary" />,
    title: 'Growth tied to impact',
    description:
      'Promotion follows demonstrated impact and scope, not tenure. Your trajectory is yours to drive.',
  },
];

const benefits = [
  { icon: <Stethoscope className="h-5 w-5" />, title: 'Health & wellbeing', text: 'Comprehensive medical cover for you and your family, plus wellbeing support.' },
  { icon: <Plane className="h-5 w-5" />, title: 'Flexible time off', text: 'Generous, trust-based leave and company-wide recharge days.' },
  { icon: <Laptop className="h-5 w-5" />, title: 'Home-office setup', text: 'A budget to build the workspace that makes you productive.' },
  { icon: <GraduationCap className="h-5 w-5" />, title: 'Learning budget', text: 'Annual stipend for courses, books, conferences, and certifications.' },
  { icon: <Globe className="h-5 w-5" />, title: 'Work from anywhere', text: 'Location-flexible roles with fair, transparent compensation bands.' },
  { icon: <Sparkles className="h-5 w-5" />, title: 'Real ownership', text: 'Equity-eligible roles so you share in the value you help create.' },
];

const voices = [
  {
    quote:
      'I joined from a college nobody had heard of. Six months in, I was leading the matching pipeline. Here, what you can build is the only credential that counts.',
    name: 'Engineering, India',
  },
  {
    quote:
      'The async culture is real. I ship from two time zones away and never feel behind — everything I need is written down and within reach.',
    name: 'Product, remote',
  },
  {
    quote:
      'Feedback is direct and kind. People genuinely want you to grow, and they tell you exactly how. That is rarer than it should be.',
    name: 'Design, remote',
  },
];

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: AppConfig.baseUrl },
    { '@type': 'ListItem', position: 2, name: 'Careers', item: `${AppConfig.baseUrl}/careers` },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Life at Baalvion',
      item: `${AppConfig.baseUrl}/careers/life-at-baalvion`,
    },
  ],
};

export default function LifeAtBaalvionPage() {
  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            Life at Baalvion
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Build like it matters. Because it does.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            We&apos;re a remote-first team building the intelligent infrastructure that
            connects exceptional talent with borderless opportunity. We hire for what you
            can do, give you real ownership, and get out of your way.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/careers/open-positions">See open roles</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/onboarding">Join Baalvion</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Values */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What we believe</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Six principles shape every hire, every review, and every product decision.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <Card key={v.title}>
                <CardHeader>
                  <div className="mb-2">{v.icon}</div>
                  <CardTitle className="text-lg">{v.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{v.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How we work</h2>
            <p className="text-lg text-muted-foreground mt-4">
              The day-to-day rhythm that lets a distributed team move fast without burning out.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {howWeWork.map((w) => (
              <Card key={w.title} className="flex">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="shrink-0 mt-1">{w.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{w.title}</CardTitle>
                    <CardDescription className="mt-1.5">{w.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Voices */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">In their words</h2>
            <p className="text-lg text-muted-foreground mt-4">
              What it actually feels like to build here — from the people doing it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {voices.map((v) => (
              <Card key={v.name} className="bg-muted/30">
                <CardContent className="pt-6">
                  <p className="text-base leading-relaxed">“{v.quote}”</p>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">— {v.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Benefits that respect your life
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              We invest in the things that let you do your best work and live a full life
              away from the keyboard.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="flex items-start gap-4 rounded-lg border bg-background p-5">
                <span className="mt-0.5 text-primary">{b.icon}</span>
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">Find your place at Baalvion</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Whether you&apos;re an experienced builder or a student just getting started,
            there&apos;s a way in — and it doesn&apos;t depend on where you came from.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/careers/open-positions">
                Browse open roles <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/careers/internship-program">Explore internships</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
