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
  Code2,
  PenTool,
  LineChart,
  Megaphone,
  Boxes,
  Users,
  Rocket,
  ClipboardCheck,
  GitBranch,
  Award,
  ArrowRight,
  GraduationCap,
  Building2,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Baalvion Studio — Where Students Build Real Things',
  description:
    'Baalvion Studio is our talent incubator: a hands-on program where students and new graduates ship real, production-grade work alongside mentors — and earn a direct pathway into internships and full-time roles.',
  alternates: { canonical: '/studio' },
  openGraph: {
    title: 'Baalvion Studio | TalentOS by Baalvion',
    description:
      'A talent incubator where students do real project work with mentors and earn a direct pathway into internships and full-time roles.',
    url: '/studio',
  },
};

const tracks = [
  { icon: <Code2 className="h-6 w-6 text-primary" />, title: 'Software Engineering', text: 'Ship features in real codebases — frontend, backend, data, and platform.' },
  { icon: <PenTool className="h-6 w-6 text-primary" />, title: 'Product Design', text: 'Take problems from research to polished, shippable interfaces.' },
  { icon: <LineChart className="h-6 w-6 text-primary" />, title: 'Data & Analytics', text: 'Turn messy data into decisions, dashboards, and models that matter.' },
  { icon: <Megaphone className="h-6 w-6 text-primary" />, title: 'Growth & Marketing', text: 'Run real campaigns, measure outcomes, and learn what moves numbers.' },
  { icon: <Boxes className="h-6 w-6 text-primary" />, title: 'Product Management', text: 'Own a slice of the roadmap — scope, prioritise, and ship with a team.' },
  { icon: <Users className="h-6 w-6 text-primary" />, title: 'Operations', text: 'Build the processes and tooling that keep a global platform running.' },
];

const phases = [
  {
    icon: <ClipboardCheck className="h-7 w-7 text-primary" />,
    step: '01',
    title: 'Apply & match',
    description:
      'Tell us your skills and interests. We match you to a track and a real project with a clear brief — no busywork.',
  },
  {
    icon: <GitBranch className="h-7 w-7 text-primary" />,
    step: '02',
    title: 'Build in the open',
    description:
      'Work in real repositories and tools with a mentor and a small pod. You own outcomes, not tickets.',
  },
  {
    icon: <Sparkles className="h-7 w-7 text-primary" />,
    step: '03',
    title: 'Review & grow',
    description:
      'Get direct, kind feedback in structured reviews. Every cycle sharpens your craft and your portfolio.',
  },
  {
    icon: <Award className="h-7 w-7 text-primary" />,
    step: '04',
    title: 'Earn your pathway',
    description:
      'Demonstrated impact converts into internships and full-time offers — judged on what you built, not where you studied.',
  },
];

const programJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOccupationalProgram',
  name: 'Baalvion Studio',
  description:
    'A talent incubator where students and new graduates do real, production-grade project work with mentors and earn a pathway into internships and full-time roles.',
  url: `${AppConfig.baseUrl}/studio`,
  provider: {
    '@type': 'Organization',
    name: AppConfig.companyName,
    sameAs: 'https://www.baalvion.com',
  },
  occupationalCategory: [
    'Software Engineering',
    'Product Design',
    'Data & Analytics',
    'Growth & Marketing',
    'Product Management',
    'Operations',
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: AppConfig.baseUrl },
    { '@type': 'ListItem', position: 2, name: 'Studio', item: `${AppConfig.baseUrl}/studio` },
  ],
};

export default function StudioPage() {
  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(programJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            Baalvion Studio · Talent Incubator
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Where students build real things.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Studio is Baalvion&apos;s hands-on incubator. Instead of toy assignments, you
            ship production-grade work on real projects, mentored by people who do this for
            a living — and earn a direct pathway into internships and full-time roles.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/onboarding/student">Apply to Studio</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/careers/internship-program">See the internship pathway</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* What it is */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-4xl font-bold text-primary">Real work</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Live projects in real codebases and tools — not simulations.
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">Real mentors</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Paired with practitioners who review your work and grow your craft.
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">Real pathway</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Impact converts into internships and full-time offers — on merit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How Studio works</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Four phases that take you from application to a real offer.
            </p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-border" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {phases.map((p) => (
                <div key={p.step} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-background border-2 border-primary shadow-sm mb-4">
                    {p.icon}
                    <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
                      {p.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Studio tracks</h2>
            <p className="text-lg text-muted-foreground mt-4">
              Pick the discipline you want to grow in. Every track ships something real.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((t) => (
              <Card key={t.title}>
                <CardHeader>
                  <div className="mb-2">{t.icon}</div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-300">
                    For students
                  </Badge>
                </div>
                <CardTitle className="text-xl">Build a portfolio that speaks for itself</CardTitle>
                <CardDescription>
                  Stop applying with class projects. Graduate with shipped work, real
                  references, and a track record recruiters can verify.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/onboarding/student">
                    Apply as a student <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    For colleges
                  </Badge>
                </div>
                <CardTitle className="text-xl">Give your students a real launchpad</CardTitle>
                <CardDescription>
                  Onboard your placement cell and route your students into Studio — verified
                  experience that lifts your placement outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/onboarding/college">
                    Onboard your college <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex justify-center mb-4">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Your work is your credential</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Studio is where potential becomes proof. Apply, build something real, and earn
            your way in — no pedigree required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/onboarding/student">Apply to Studio</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/placement">Explore campus placements</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
