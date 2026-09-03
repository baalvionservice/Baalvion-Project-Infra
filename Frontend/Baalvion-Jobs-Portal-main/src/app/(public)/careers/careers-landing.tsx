'use server';

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, GraduationCap, Briefcase, HeartHandshake, TrendingUp, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { talentService } from '@/services/talent.service';
import { AppConfig } from '@/config/app.config';
import { JobSearchBar } from '@/modules/talent-acquisition/components/JobSearchBar';
import { JobResultRow } from '@/modules/talent-acquisition/components/JobResultRow';

export async function getCareersLandingMetadata(canonicalPath: string): Promise<Metadata> {
  // `absolute` — this title already carries the brand, and the root layout's
  // `%s | TalentOS by Baalvion` template would otherwise append it a second time.
  const title = 'TalentOS by Baalvion | Careers & Global Hiring';
  const description =
    'Careers at Baalvion: engineering, mining, media and operations roles across India and worldwide — one application, one dashboard, one Candidate ID.';

  // `/` and `/careers` render the identical landing page. Both stay reachable, but they
  // point at one canonical URL so they don't compete with each other for the same query.
  const canonicalUrl = `${AppConfig.baseUrl}/`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl, type: 'website' },
  };
}

// What the company is about, said once and plainly. Three panels, no icon doing the
// work of a sentence.
const aboutPanels = [
  {
    icon: HeartHandshake,
    title: 'How we hire',
    body: 'Structured interviews against a published rubric, and a written answer either way. You can see every stage of your own application from the moment you apply.',
    href: '/careers/hiring-process',
    cta: 'Our hiring process',
  },
  {
    icon: Briefcase,
    title: 'What it is like here',
    body: 'Remote-first where the work allows and on site where it does not — a mine, a studio and a plant are not remote jobs. Both are treated as real careers.',
    href: '/careers/life-at-baalvion',
    cta: 'Life at Baalvion',
  },
  {
    icon: TrendingUp,
    title: 'Growing here',
    body: 'Ladders that go up without forcing you into management, a learning budget, and internal moves advertised before they are filled from outside.',
    href: '/about',
    cta: 'About Baalvion',
  },
];

export async function CareersLanding() {
  const [featured, locations, facets, countries, departments] = await Promise.all([
    talentService.getJobs({ status: 'published', limit: 6, page: 1 }).catch(() => ({ data: [], total: 0 } as any)),
    talentService.getJobLocations().catch(() => [] as any[]),
    talentService.getJobFacets().catch(() => null),
    talentService.getCountries({ isActive: true }).catch(() => [] as any[]),
    talentService.getDepartments({}).catch(() => [] as any[]),
  ]);

  const departmentName = (id: string) => (departments as any[]).find((d) => d.id === id)?.name;
  const countryName = (id: string) => (countries as any[]).find((c) => c.id === id)?.name;

  const totalOpen = facets?.total ?? featured.total ?? 0;

  // Real places with real counts, drawn from published listings — this never advertises
  // a town we have nothing open in.
  const topPlaces = (locations as any[]).filter((l) => l.type !== 'country').slice(0, 12);
  const topTeams = (facets?.department ?? []).slice(0, 8);

  return (
    <main className="flex flex-col bg-background">
      {/* ── Hero: a colour block, the way the reference uses them ─────────── */}
      {/*
        The reference site puts its colour in solid panels — #6f00ef purple, #ff4713
        orange-red, #ffce00 yellow — over a black-on-white base, with plain black
        buttons. Not tinted text, not a gradient. This is that: a purple block, white
        headline, yellow CTA, and the search lifted onto white on top of it.
      */}
      <section className="relative overflow-hidden border-b bg-brand-purple text-white">
        <div
          className="pointer-events-none absolute -right-16 -top-40 hidden h-[34rem] w-[34rem] rounded-full bg-brand-orange opacity-90 md:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 right-40 hidden h-64 w-64 rounded-full bg-brand-yellow md:block"
          aria-hidden
        />
        <div className="container relative mx-auto max-w-6xl px-4 py-20 lg:py-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
            Careers at Baalvion
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Work that is judged on what you can do.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85">
            {totalOpen > 0
              ? `${totalOpen} roles open right now — engineering and AI, mining and plant, media and production, operations, finance and people — across India and worldwide.`
              : 'Engineering and AI, mining and plant, media and production, operations, finance and people — across India and worldwide.'}
          </p>

          <div className="mt-10 max-w-4xl bg-background p-5 text-foreground shadow-[6px_6px_0_0_rgba(0,0,0,0.9)]">
            {/*
              JobSearchBar reads useSearchParams(), which forces a page out of static
              rendering unless it sits behind a Suspense boundary — and this landing
              page is statically prerendered at `/`. Without the boundary the export
              of `/` fails outright, which `next dev` never surfaces because it does
              not statically export. The fallback holds the same height so the hero
              does not jump when the form hydrates.
            */}
            <Suspense fallback={<div className="h-[74px]" aria-hidden />}>
              <JobSearchBar destination="/careers/open-positions" />
            </Suspense>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-brand-yellow text-black hover:bg-brand-yellow/90">
              <Link href="/careers/open-positions">
                Search all roles <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/50 bg-transparent text-white hover:bg-white hover:text-brand-purple"
            >
              <Link href="/careers/internship-program">
                <GraduationCap className="mr-2 h-4 w-4" /> Students &amp; graduates
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Who we are ─────────────────────────────────────────────────────── */}
      <section className="border-b">
        <div className="container mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Who we are</h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>
                Baalvion Industries builds TalentOS — the hiring platform this site runs on —
                and operates in mining, media and technology across India and beyond.
              </p>
              <p>
                Because we sell hiring software, how we hire is the product demonstration.
                That is the whole reason our salary bands are published, our stages are
                visible to you, and nobody waits three weeks for an answer.
              </p>
              <Link href="/about" className="inline-flex items-center font-medium text-foreground underline underline-offset-4">
                Learn more <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest roles ───────────────────────────────────────────────────── */}
      {featured.data.length > 0 && (
        <section className="border-b">
          <div className="container mx-auto max-w-6xl px-4 py-16 lg:py-20">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Latest roles</h2>
              <Link href="/careers/open-positions" className="text-sm font-medium underline underline-offset-4">
                See all {totalOpen > 0 ? totalOpen : ''} roles
              </Link>
            </div>
            <ul className="mt-8">
              {(featured.data as any[]).map((job) => (
                <JobResultRow
                  key={job.id}
                  job={job}
                  departmentName={departmentName(job.departmentId)}
                  countryName={countryName(job.countryId)}
                  countries={countries as any[]}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Where we are hiring ────────────────────────────────────────────── */}
      {topPlaces.length > 0 && (
        <section className="border-b bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4 py-16 lg:py-20">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Where we are hiring</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Cities, towns and the places in between. Search your own town — it also covers
              the region around it.
            </p>
            <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {topPlaces.map((place: any) => (
                <li key={place.slug}>
                  <Link
                    href={`/careers/jobs/${place.slug}`}
                    className="flex items-baseline justify-between border-b py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>
                      <span className="text-foreground">{place.name}</span>
                      {place.parentName && <span> · {place.parentName}</span>}
                    </span>
                    <span className="tabular-nums">{place.jobCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── Teams ──────────────────────────────────────────────────────────── */}
      {topTeams.length > 0 && (
        <section className="border-b">
          <div className="container mx-auto max-w-6xl px-4 py-16 lg:py-20">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Teams hiring now</h2>
            <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {topTeams.map((team: any) => (
                <li key={team.value}>
                  <Link
                    href={`/careers/open-positions?department=${team.value}`}
                    className="flex items-baseline justify-between border-b py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="truncate pr-3 text-foreground">{team.label}</span>
                    <span className="tabular-nums">{team.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── About working here ─────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">A bit about working here</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {aboutPanels.map((panel, i) => {
              const Icon = panel.icon;
              // One block per accent, black text on all three — the reference's own
              // treatment for a row of cards.
              const block = ['bg-brand-yellow', 'bg-brand-pink', 'bg-brand-orange'][i % 3];
              return (
                <div key={panel.title} className={`${block} p-7 text-black`}>
                  <Icon className="h-5 w-5" aria-hidden />
                  <h3 className="mt-4 text-lg font-bold">{panel.title}</h3>
                  <p className="mt-2 leading-relaxed text-black/80">{panel.body}</p>
                  <Link
                    href={panel.href}
                    className="mt-4 inline-flex items-center text-sm font-bold underline underline-offset-4"
                  >
                    {panel.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Recruitment fraud ──────────────────────────────────────────────── */}
      {/*
        A hiring platform is a target: people impersonate real companies to take
        "registration fees" from job seekers. Saying plainly what we will and will not do
        is the cheapest protection we can give a candidate, and it belongs on the page
        they land on rather than buried in a help centre.
      */}
      <section className="border-b">
        <div className="container mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <div className="flex max-w-3xl gap-4">
            <ShieldAlert className="mt-1 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <h2 className="text-xl font-bold tracking-tight">Stay alert: recruitment fraud</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                People do impersonate Baalvion to defraud job seekers. So that you can tell
                the difference:
              </p>
              <ul className="mt-4 space-y-2.5 leading-relaxed text-muted-foreground">
                <li className="flex gap-3">
                  <span aria-hidden>·</span>
                  <span>
                    <strong className="font-medium text-foreground">We never ask you for money.</strong>{' '}
                    Not for an application, a registration, a security deposit, training, an
                    audition, equipment or a visa. Never, for any role.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden>·</span>
                  <span>
                    Every application goes through this site, and every update appears on your
                    own dashboard. If it exists only in a chat app, it is not us.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden>·</span>
                  <span>
                    We do not make an offer without an interview, and we do not ask for bank
                    details or identity documents over a messaging app.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden>·</span>
                  <span>
                    If something feels wrong,{' '}
                    <Link href="/contact" className="font-medium text-foreground underline underline-offset-4">
                      tell us
                    </Link>{' '}
                    — even if you are not sure. We would rather check.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing ────────────────────────────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-16 text-center lg:py-20">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            One application, one dashboard
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Register once and you get a Candidate ID that follows you across every role you
            apply for — with the status of each one, and a way to message the hiring team
            directly.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/careers/open-positions">Browse roles first</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
