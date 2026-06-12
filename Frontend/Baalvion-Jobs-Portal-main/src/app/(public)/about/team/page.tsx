import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeamGrid } from '@/modules/team/components/TeamGrid';
import { globalLeaders, leadershipTeam } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { TeamMember } from '@/lib/team.data';
import {
  ArrowRight,
  Globe,
  Lightbulb,
  Users,
  Zap,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Meet the Team | Baalvion Industries — TalentOS Leadership',
  description:
    'Meet the engineers, strategists, and operators building TalentOS — the intelligent hiring infrastructure connecting exceptional talent with borderless opportunity.',
  keywords: [
    'Baalvion team',
    'TalentOS leadership',
    'Baalvion Industries founders',
    'global hiring platform team',
    'tech leadership India',
    'Baalvion executives',
    'talent infrastructure company',
  ],
  alternates: {
    canonical: '/about/team',
  },
  openGraph: {
    title: 'Meet the Team | TalentOS by Baalvion Industries',
    description:
      'The creators, innovators, and problem-solvers shaping the intelligent infrastructure for global talent.',
    url: '/about/team',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet the Team | TalentOS by Baalvion',
    description:
      'The creators, innovators, and problem-solvers shaping the intelligent infrastructure for global talent.',
  },
};

const principles = [
  'Meritocracy: We believe the best ideas win, regardless of who or where they come from.',
  'Ownership: We are a team of owners. We take accountability for our work from start to finish.',
  'Excellence: We are obsessed with quality and hold ourselves to the highest standards in every detail.',
  'Long-Term Vision: We build for the decade, not just the quarter, creating resilient and future-proof systems.',
];

const cultureValues = [
  {
    icon: Globe,
    title: 'Borderless by Default',
    description:
      'We operate across time zones without friction. Remote-first does not mean isolated — our async culture keeps every contributor in sync regardless of geography.',
  },
  {
    icon: Lightbulb,
    title: 'Systems Thinking',
    description:
      'We design for scale from day one. Every decision considers downstream effects, second-order consequences, and long-term maintainability.',
  },
  {
    icon: ShieldCheck,
    title: 'Radical Transparency',
    description:
      'Goals, metrics, and context are shared openly. We believe better-informed people make better decisions — at every level of the organisation.',
  },
  {
    icon: TrendingUp,
    title: 'Compound Growth',
    description:
      'We invest in people who compound. Continuous learning, cross-functional exposure, and deliberate skill-building are built into how we work every day.',
  },
];

const whyJoinCards = [
  {
    title: 'Solve Hard Problems',
    body: 'TalentOS processes millions of signals to match talent to opportunity intelligently. The engineering challenges here are real, meaningful, and unsolved.',
  },
  {
    title: 'Global Reach, Day One',
    body: 'Your work ships to employers and candidates across 30+ countries from the moment you join. Scale is not a milestone here — it is the baseline.',
  },
  {
    title: 'Ownership at Every Level',
    body: 'We do not believe in proxy ownership. You own your scope end-to-end — from architecture decisions to deployment to customer outcomes.',
  },
  {
    title: 'Performance-Driven Growth',
    body: 'Promotion at Baalvion is earned by demonstrated impact, not tenure or politics. The fastest path up is the work itself.',
  },
];

const relatedLinks = [
  { href: '/careers/open-positions', label: 'View Open Roles' },
  { href: '/careers/life-at-baalvion', label: 'Life at Baalvion' },
  { href: '/about', label: 'About TalentOS' },
  { href: '/about/diversity', label: 'Diversity & Inclusion' },
  { href: '/placement', label: 'Placement Programs' },
];

// Convert data.ts format to TeamMember format
const convertToTeamMember = (member: any, category: string): TeamMember => {
  return {
    id: member.name.toLowerCase().replace(/\s+/g, '-'),
    name: member.name,
    role: member.title,
    tagline: member.position || category,
    bio: member.bio,
    expertise: [],
    socials: {
      linkedin: '',
    },
    image: member.imageId || '',
    imageHint: 'person portrait',
  };
};

export default async function TeamPage() {
  const leaders = leadershipTeam.map((member) =>
    convertToTeamMember(member, 'Leadership Team'),
  );
  const cofounders = globalLeaders.map((member) =>
    convertToTeamMember(member, 'Global Leaders'),
  );

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'The Minds Behind Baalvion',
    description:
      'Meet the team of creators, innovators, and problem-solvers at Baalvion.',
    url: 'https://jobs.baalvion.com/about/team',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: leaders.map((member, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Person',
          name: member.name,
          jobTitle: member.role,
          image: member.image,
          description: member.bio,
          worksFor: {
            '@type': 'Organization',
            name: 'Baalvion Industries Pvt Ltd',
          },
        },
      })),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://jobs.baalvion.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'About',
        item: 'https://jobs.baalvion.com/about',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Team',
        item: 'https://jobs.baalvion.com/about/team',
      },
    ],
  };

  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Hero Section */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge variant="outline" className="mb-4">
            The Team
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            The Minds Behind Baalvion
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
            We are a collective of engineers, designers, and strategists united
            by a single goal: to build the intelligent infrastructure that
            connects exceptional talent with borderless opportunity.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/careers/open-positions">
                Join the Team <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/about">About Baalvion</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How We Work — Culture Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              How We Work
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our culture is not a set of perks — it is the operating system
              that determines how decisions get made, how work gets done, and
              how people grow at Baalvion.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cultureValues.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="bg-card">
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <TeamGrid members={leaders} />
        </div>
        <Separator className="h-32 bg-muted/40 border-b-2 mb-32 border-neutral-300" />
        <div className="container mx-auto px-4">
          <TeamGrid members={cofounders} />
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Why Join Baalvion
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We are not building another job board. We are building the
              category-defining talent infrastructure for the next decade of
              global work.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {whyJoinCards.map((card) => (
              <Card key={card.title} className="bg-card">
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{card.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Principles Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Our Leadership Principles
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our principles guide our decisions, our code, and our culture.
            </p>
          </div>
          <div className="grid gap-6">
            {principles.map((principle, index) => (
              <div key={index} className="flex items-start gap-4">
                <Zap className="h-6 w-6 text-primary mt-1 shrink-0" />
                <p className="text-lg text-muted-foreground">{principle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Baalvion — Related Links */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Explore Baalvion
            </h2>
            <p className="mt-3 text-muted-foreground">
              Learn more about our mission, culture, and open opportunities.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {relatedLinks.map((link) => (
              <Button key={link.href} asChild variant="outline" size="lg">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <Button asChild variant="outline" size="lg">
              <a
                href="https://www.baalvion.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Baalvion Corporate Site
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Join Our Mission
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            We are always looking for talented individuals who are passionate
            about building the future of work. Skill over geography, merit over
            pedigree.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/careers/open-positions">
                Explore Open Roles <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/careers/life-at-baalvion">
                Life at Baalvion
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
