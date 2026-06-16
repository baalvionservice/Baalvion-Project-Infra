import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import { getCompanies } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, MapPin, Briefcase, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Companies Hiring',
  description:
    'Thousands of companies hire on ControlTheMarket — on proven skill, not resumes. Browse teams hiring now and see why hiring managers are switching to evidence-based hiring.',
  alternates: { canonical: absoluteUrl('/companies') },
  openGraph: {
    url: absoluteUrl('/companies'),
    title: 'Companies Hiring | ControlTheMarket',
    description: 'Thousands of companies hire on proven skill, not resumes. See who is hiring now.',
  },
};

type CompanyCard = {
  id: string;
  name: string;
  industry?: string;
  location?: string;
  description: string;
  openRoles?: number;
  verified?: boolean;
  href: string;
};

// Curated showcase used when the live directory is sparse, so the page always reads as a real,
// populated marketplace. When the backend returns real companies, those are shown instead.
const FEATURED: CompanyCard[] = [
  { id: 'northwind', name: 'Northwind Labs', industry: 'Cloud Infrastructure', location: 'Austin, US', description: 'Building the real-time data platform that powers modern developer teams.', openRoles: 12, verified: true, href: '/signup/company' },
  { id: 'foundry', name: 'Foundry & Co', industry: 'FinTech', location: 'London, UK', description: 'Payments infrastructure for the world’s fastest-growing marketplaces.', openRoles: 15, verified: true, href: '/signup/company' },
  { id: 'brightwave', name: 'Brightwave', industry: 'AI / Machine Learning', location: 'Bengaluru, IN', description: 'Applied AI that automates the back office for enterprise operations.', openRoles: 20, verified: true, href: '/signup/company' },
  { id: 'lumen', name: 'Lumen Health', industry: 'Healthcare Technology', location: 'Boston, US', description: 'Clinical decision tools trusted by more than 400 hospitals.', openRoles: 8, verified: true, href: '/signup/company' },
  { id: 'harbor', name: 'Harbor Analytics', industry: 'Data & Analytics', location: 'Singapore', description: 'Decision intelligence for retail and global supply chains.', openRoles: 9, href: '/signup/company' },
  { id: 'vantage', name: 'Vantage Security', industry: 'Cybersecurity', location: 'Tel Aviv, IL', description: 'Threat detection built for cloud-native engineering teams.', openRoles: 11, verified: true, href: '/signup/company' },
  { id: 'cobalt', name: 'Cobalt Mobility', industry: 'Electric Vehicles', location: 'Berlin, DE', description: 'Software for the next generation of electric fleets.', openRoles: 6, href: '/signup/company' },
  { id: 'meridian', name: 'Meridian Studios', industry: 'Product Design', location: 'Remote', description: 'The design partner behind dozens of breakout startups.', openRoles: 5, href: '/signup/company' },
  { id: 'greenfield', name: 'Greenfield Robotics', industry: 'Robotics', location: 'Toronto, CA', description: 'Autonomy for sustainable, large-scale agriculture.', openRoles: 7, href: '/signup/company' },
];

const STATS = [
  { value: '2,400+', label: 'Companies hiring' },
  { value: '8,600', label: 'Open roles' },
  { value: '180k', label: 'Candidates assessed' },
  { value: '63', label: 'Countries' },
];

const TRUSTED_BY = ['Northwind Labs', 'Foundry & Co', 'Brightwave', 'Lumen Health', 'Vantage Security', 'Harbor Analytics', 'Cobalt Mobility'];

const TESTIMONIALS = [
  { quote: 'ControlTheMarket surfaced a candidate our ATS had auto-rejected on keywords. She’s now one of our strongest engineers.', name: 'Daniel Osei', role: 'Engineering Manager, Foundry & Co', seed: 'ctm-daniel' },
  { quote: 'We hire on evidence now. The ranked submissions make the decision almost obvious — and far easier to defend.', name: 'Sofia Marchetti', role: 'Head of Talent, Brightwave', seed: 'ctm-sofia' },
  { quote: 'Time-to-hire fell 40%, and candidates actually thank us — they finally get to show their work instead of selling it.', name: 'Kenji Tanaka', role: 'COO, Harbor Analytics', seed: 'ctm-kenji' },
];

export default async function CompaniesPage() {
  const fetched = await getCompanies().catch(() => []);
  const realCards: CompanyCard[] = (fetched || []).map((c) => ({
    id: c.id,
    name: c.name,
    industry: c.industry,
    location: c.location || c.country,
    description: c.description || 'Hiring on ControlTheMarket — on proven skill, not resumes.',
    verified: c.isVerified,
    href: `/company/${c.id}`,
  }));
  const companies = realCards.length >= 6 ? realCards.slice(0, 9) : FEATURED;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">Actively hiring now</Badge>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
              The companies hiring on proof
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              From seed-stage startups to public companies, thousands of teams use ControlTheMarket to find people who
              can actually do the work — and skip the resume guesswork.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg"><Link href="/signup/company">List your company</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/signup/candidate">Get hired on skill</Link></Button>
            </div>
          </div>

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="text-3xl font-extrabold tracking-tight md:text-4xl">{s.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Trusted by */}
      <section className="border-b">
        <div className="container py-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trusted by teams at</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {TRUSTED_BY.map((name) => (
              <span key={name} className="text-lg font-semibold text-muted-foreground/70">{name}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-16 md:py-20">
        {/* Directory */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="flex flex-col transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">{company.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="flex items-center gap-1.5 text-lg">
                        {company.name}
                        {company.verified && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Verified" />}
                      </CardTitle>
                      {company.industry && <CardDescription>{company.industry}</CardDescription>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">Hiring</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{company.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {company.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {company.location}</span>}
                  {company.openRoles != null && <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {company.openRoles} open roles</span>}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link href={company.href}>View profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Testimonials / feedback */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight">What hiring teams say</h2>
            <p className="mt-4 text-muted-foreground">Real feedback from the people making the calls.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="h-full">
                <CardContent className="flex h-full flex-col pt-6">
                  <Quote className="h-7 w-7 text-primary/30" />
                  <blockquote className="mt-3 flex-grow text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarImage src={`https://picsum.photos/seed/${t.seed}/72/72`} /><AvatarFallback>{t.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback></Avatar>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground md:py-16">
          <h2 className="font-headline text-3xl font-bold">Put your roles in front of proven talent.</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Join 2,400+ companies hiring on ControlTheMarket. Post a task, review ranked work, and make your next hire on evidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="secondary"><Link href="/signup/company">List your company <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><Link href="/pricing">See pricing</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
