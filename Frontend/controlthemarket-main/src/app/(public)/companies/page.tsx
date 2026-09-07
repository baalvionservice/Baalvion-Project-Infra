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
import { ArrowRight, BadgeCheck, MapPin, Briefcase, Quote, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Companies Hiring',
  description:
    // Metadata is a claim too — it is what search engines quote. No scale assertion here
    // while the directory is empty.
    'Hire on proven skill, not resumes. Browse the teams hiring on ControlTheMarket and see how evidence-based hiring works.',
  alternates: { canonical: absoluteUrl('/companies') },
  openGraph: {
    url: absoluteUrl('/companies'),
    title: 'Companies Hiring | ControlTheMarket',
    description: 'Hire on proven skill, not resumes. See who is hiring on ControlTheMarket.',
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

/**
 * Fallback cards for the directory — NOT companies.
 *
 * This list previously held seven invented employers (Northwind Labs, Foundry & Co, Brightwave,
 * …) with fabricated locations, descriptions, open-role counts and `verified: true`. The
 * original comment said the quiet part: they existed "so the page always reads as a real,
 * populated marketplace". With no real companies in the database, every employer a visitor saw
 * was fictional — and marked verified.
 *
 * Empty now. When the directory has nothing in it, the page says so.
 */
const FEATURED: CompanyCard[] = [];

/**
 * Real measurements only.
 *
 * These four figures — 2,400+ companies, 8,600 open roles, 180k candidates assessed, 63
 * countries — were invented. The database currently holds zero companies, zero tasks and zero
 * users, so every one of them was off by its entire value.
 *
 * Populate from live counts when there is something to count. The band hides while empty.
 */
type Stat = { value: string; label: string };
const STATS: Stat[] = [];

/**
 * Real customers only.
 *
 * This listed seven invented companies — Northwind Labs, Foundry & Co, Brightwave and others —
 * under the heading "Trusted by teams at". None of them exist as customers; the database holds
 * no companies at all. Naming fictional clients is a claim about who uses the product.
 *
 * The band below renders nothing while this is empty.
 */
const TRUSTED_BY: string[] = [];

/**
 * Real endorsements only.
 *
 * Three fabricated quotes lived here, attributed to named people at named companies and
 * carrying invented performance figures ("Time-to-hire fell 40%"). An invented endorsement is
 * a statement someone did not make, and an invented statistic is a claim about results the
 * product has not been shown to produce.
 */
type Testimonial = { quote: string; name: string; role: string; seed: string };
const TESTIMONIALS: Testimonial[] = [];

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
  // Real companies only. This used to swap in the fictional showcase whenever fewer than six
  // real ones existed, so a sparse directory silently became an invented one.
  const companies = realCards.slice(0, 9);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            {/* "Actively hiring now" asserted live activity; nothing is posted yet. */}
            <Badge variant="secondary" className="mb-4">Hire on proven work</Badge>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
              The companies hiring on proof
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {/* "thousands of teams use ControlTheMarket" was a scale claim with nothing
                  behind it. Describes what the product does, not how many use it. */}
              Hire on evidence, not resumes. Send a real task, review ranked submissions, and
              find people who can actually do the work.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg"><Link href="/signup/company">List your company</Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/signup/candidate">Get hired on skill</Link></Button>
            </div>
          </div>

          {STATS.length > 0 && (
          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <dt className="text-3xl font-extrabold tracking-tight md:text-4xl">{s.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
          )}
        </div>
      </section>

      {/* Trusted by */}
      {TRUSTED_BY.length > 0 && (
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
      )}

      <div className="container py-16 md:py-20">
        {/* Directory */}
        {companies.length === 0 ? (
          // An honest empty directory. Previously this state was impossible to reach: the page
          // substituted seven fictional employers so it never looked new.
          <Card className="mx-auto max-w-xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 px-8 py-16 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-lg font-semibold">No companies listed yet</h2>
              <p className="text-sm text-muted-foreground">
                ControlTheMarket is new. Be one of the first teams to hire here on proven work
                rather than resumes.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/signup/company">List your company</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
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
        )}

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
            {/* "Join 2,400+ companies" was invented — the platform has none yet. */}
            Post a task, review ranked work, and make your next hire on evidence.
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
