import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle,
  Globe,
  Network,
  Scale,
  Shield,
  Target,
  Users,
  Zap,
  Gem,
  BarChart3,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "About Us | TalentOS by Baalvion — Intelligent Global Hiring Infrastructure",
  description:
    "Baalvion Industries builds TalentOS: AI-driven, compliant global hiring infrastructure that connects exceptional talent with borderless opportunity. Skill over geography.",
  keywords: [
    "Baalvion Industries",
    "TalentOS",
    "global hiring platform",
    "AI recruitment",
    "borderless talent",
    "intelligent hiring infrastructure",
    "meritocratic hiring",
    "cross-border employment",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | TalentOS by Baalvion — Intelligent Global Hiring Infrastructure",
    description:
      "Baalvion Industries builds TalentOS: AI-driven, compliant global hiring infrastructure connecting exceptional talent with borderless opportunity.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | TalentOS by Baalvion",
    description:
      "AI-driven, compliant global hiring infrastructure. Skill over geography — meritocratic hiring for the modern era.",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Baalvion Industries Pvt Ltd",
  url: "https://jobs.baalvion.com",
  sameAs: ["https://www.baalvion.com"],
  description:
    "Baalvion builds TalentOS, the intelligent infrastructure platform for global, AI-driven, compliant talent acquisition.",
  foundingDate: "2023",
  areaServed: "Worldwide",
  knowsAbout: [
    "Global Talent Acquisition",
    "AI-Driven Recruitment",
    "Cross-Border Hiring Compliance",
    "Enterprise HR Technology",
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://jobs.baalvion.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About",
      item: "https://jobs.baalvion.com/about",
    },
  ],
};

type StatItem = {
  value: string;
  label: string;
  sublabel: string;
};

const stats: StatItem[] = [
  { value: "50+", label: "Countries Served", sublabel: "Cross-border reach" },
  { value: "200K+", label: "Roles Processed", sublabel: "AI-screened annually" },
  { value: "98%", label: "Screening Accuracy", sublabel: "vs keyword-only ATS" },
  { value: "10+", label: "Enterprise Partners", sublabel: "Multi-org deployments" },
];

type FeatureCard = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const platformFeatures: FeatureCard[] = [
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: "AI Resume Intelligence",
    description:
      "Moving beyond keywords to deeply understand skills, experience trajectories, and career potential. Our NLP pipeline reads context, not just syntax.",
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Structured Candidate Scoring",
    description:
      "A multi-vector scoring engine provides a holistic, bias-reduced view of candidate-job alignment using skill signals, not demographic proxies.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Hiring Rails",
    description:
      "Compliant, multi-region architecture designed for cross-border hiring, payments, and regulatory adherence from day one—no bespoke legal workarounds.",
  },
  {
    icon: <Network className="h-6 w-6" />,
    title: "Multi-Tenant SaaS",
    description:
      "Secure, isolated environments for every organization. Enterprise-grade data partitioning means your talent pipeline stays yours.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Enterprise Hiring Analytics",
    description:
      "A unified command center for pipeline visibility, funnel analytics, and strategic workforce planning—built for people-ops leaders, not spreadsheets.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Compliance & Data Privacy",
    description:
      "Privacy-first architecture engineered to meet GDPR, CCPA, and local labor data standards globally. Compliance is infrastructure, not an afterthought.",
  },
];

type HowItWorksStep = {
  step: string;
  title: string;
  description: string;
};

const howItWorksSteps: HowItWorksStep[] = [
  {
    step: "01",
    title: "Ingest & Understand",
    description:
      "Employers publish structured role requirements. TalentOS parses them into a rich capability model—skills, seniority signals, compliance constraints, and team-fit vectors.",
  },
  {
    step: "02",
    title: "Match & Score",
    description:
      "Our AI screening engine evaluates every applicant against the role model, surfacing ranked candidates with transparent scoring rationales. No black-box rankings.",
  },
  {
    step: "03",
    title: "Comply & Close",
    description:
      "Cross-border compliance checks, structured offer workflows, and multi-currency payment rails let employers hire globally with the same confidence as local recruitment.",
  },
  {
    step: "04",
    title: "Learn & Improve",
    description:
      "Every hiring decision feeds a feedback loop that continuously refines scoring models per organization—so the platform gets smarter with every placement.",
  },
];

type CoreValue = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const coreValues: CoreValue[] = [
  {
    icon: <Target className="h-8 w-8 text-primary" />,
    title: "Precision",
    description:
      "Deliberate and rigorous in everything we build. From system design to interface detail, quality is non-negotiable.",
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Integrity",
    description:
      "Trust is earned through transparency and keeping commitments—to users, partners, and the candidates whose careers depend on fair systems.",
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: "Intelligence",
    description:
      "AI and data to create genuinely smarter, fairer outcomes—not as marketing language, but as a measurable engineering standard.",
  },
  {
    icon: <Scale className="h-8 w-8 text-primary" />,
    title: "Long-Term Thinking",
    description:
      "Decisions for the decade, not the quarter. We build resilient infrastructure that scales with the world's workforce.",
  },
  {
    icon: <Gem className="h-8 w-8 text-primary" />,
    title: "Excellence",
    description:
      "Best-in-class is the baseline, not the aspiration. We hold every layer of the stack to the highest standard.",
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Velocity",
    description:
      "Urgency and focus—shipping meaningful improvements rapidly without sacrificing quality or correctness.",
  },
];

type RelatedLink = {
  href: string;
  label: string;
  description: string;
  external?: boolean;
};

const relatedLinks: RelatedLink[] = [
  { href: "/careers/open-positions", label: "Open Roles", description: "Join the team building TalentOS" },
  { href: "/placement", label: "Talent Placement", description: "How we connect candidates to opportunity" },
  { href: "/about/team", label: "Our Team", description: "The people behind the platform" },
  { href: "/about/diversity", label: "Diversity & Inclusion", description: "Our commitment to equitable hiring" },
  { href: "/faqs", label: "FAQs", description: "Common questions answered" },
  {
    href: "https://www.baalvion.com",
    label: "Baalvion Corporate",
    description: "Our parent company and broader mission",
    external: true,
  },
];

function StatCard({ stat }: { stat: StatItem }) {
  return (
    <div className="text-center">
      <p className="text-5xl font-bold tracking-tight text-primary">{stat.value}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{stat.label}</p>
      <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
    </div>
  );
}

function PlatformFeatureCard({ feature }: { feature: FeatureCard }) {
  return (
    <div className="border bg-card p-6 rounded-lg">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-md shrink-0">
          {feature.icon}
        </div>
        <div>
          <h3 className="text-xl font-bold">{feature.title}</h3>
          <p className="mt-1 text-muted-foreground">{feature.description}</p>
        </div>
      </div>
    </div>
  );
}

function ValueCard({ value }: { value: CoreValue }) {
  return (
    <div className="bg-background rounded-lg p-6">
      <div className="flex items-center gap-4">
        {value.icon}
        <h3 className="text-2xl font-semibold">{value.title}</h3>
      </div>
      <p className="mt-2 text-muted-foreground">{value.description}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container mx-auto px-4 pt-6 pb-0">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground font-medium">About</li>
        </ol>
      </nav>

      {/* 1. Hero */}
      <section className="py-24 sm:py-32 text-center bg-muted/30">
        <div className="container mx-auto px-4">
          <Badge variant="secondary" className="mb-6">Baalvion Industries Pvt Ltd</Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            The Operating System<br className="hidden md:block" /> for Global Talent
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
            We are building the intelligent infrastructure that connects exceptional talent
            with borderless opportunity. Skill over geography. Meritocracy by design.
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">
            TalentOS &mdash; jobs.baalvion.com
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/careers/open-positions">
                View Open Roles <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Partner With Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* 2. Credibility / Stats Band */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-12">
            Platform capability at a glance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>
      </section>

      <Separator />

      {/* 3. Our Mission */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-4">Our Mission</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Talent is global. Opportunity should be too.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Traditional hiring is constrained by geography, bias, and inefficiency.
              Baalvion exists to dismantle these barriers—creating a fair, intelligent,
              and transparent ecosystem where skill is the only currency that matters.
            </p>
          </div>
          <div className="bg-background p-8 rounded-lg border">
            <blockquote className="text-xl md:text-2xl font-semibold leading-snug">
              &ldquo;To unlock the world&apos;s human potential by building the infrastructure
              for truly meritocratic, borderless hiring.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm text-muted-foreground font-medium uppercase tracking-wider">
              Founder&apos;s Mission Statement
            </p>
          </div>
        </div>
      </section>

      {/* 4. Vision */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Our 10-Year Vision</h2>
          <p className="mt-6 text-xl text-muted-foreground">
            We envision a future where any organization can seamlessly hire the best talent
            from any nation. Baalvion will be the foundational layer—the global rails—upon
            which a new, multi-country, multi-organization workforce ecosystem runs.
            Secure, compliant, and intelligent by default.
          </p>
        </div>
      </section>

      {/* 5. How TalentOS Works */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Four pillars. One intelligent platform.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              TalentOS is not another job board. It is an end-to-end hiring operating system
              built for enterprise-grade, cross-border talent acquisition.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {howItWorksSteps.map((step) => (
              <Card key={step.step} className="bg-background">
                <CardHeader>
                  <p className="text-4xl font-bold text-primary/30 mb-2">{step.step}</p>
                  <CardTitle className="text-2xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. The Platform */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">The Baalvion Platform</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Six integrated capabilities engineering a smarter, fairer, faster hire.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {platformFeatures.map((feature) => (
              <PlatformFeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. The Problem */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              The Problem with Yesterday&apos;s Hiring
            </h2>
            <ul className="mt-6 space-y-4 text-lg text-muted-foreground">
              <li className="flex items-start gap-3">
                <ArrowRight className="h-6 w-6 text-primary mt-1 shrink-0" />
                <span>
                  <span className="font-semibold text-foreground">Inefficient Filtering: </span>
                  Valuable candidates are lost in a sea of irrelevant resumes and keyword-matching noise.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-6 w-6 text-primary mt-1 shrink-0" />
                <span>
                  <span className="font-semibold text-foreground">Geographic &amp; Unconscious Bias: </span>
                  Talent is overlooked due to location, name, or demographic signals unrelated to capability.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ArrowRight className="h-6 w-6 text-primary mt-1 shrink-0" />
                <span>
                  <span className="font-semibold text-foreground">Compliance Complexity: </span>
                  Companies struggle to hire and manage talent across borders without costly legal overhead.
                </span>
              </li>
            </ul>
          </div>
          <div className="border-l-4 border-primary pl-8">
            <p className="text-xl font-medium text-foreground">
              Baalvion solves this by abstracting away the complexity. We replace manual,
              biased processes with an intelligent, data-driven system that surfaces the
              right talent for the right role—regardless of geography.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {["Bias-reduced AI screening", "Global compliance built in", "Transparent, explainable rankings"].map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-foreground font-medium">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Philosophy */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-4">
            <Badge variant="secondary">Our Philosophy</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Skill Over Geography.</h2>
            <p className="text-lg text-muted-foreground">
              The best person for the job should get the job—regardless of their passport.
              Our entire platform is engineered around this conviction. We build tools that
              promote fairness, dismantle bias, and create economic opportunity for all.
            </p>
            <p className="text-lg text-muted-foreground">
              Learn more about how this philosophy shapes our <Link href="/about/diversity" className="text-primary underline-offset-4 hover:underline">diversity and inclusion commitments</Link>.
            </p>
          </div>
          <div className="flex justify-center items-center">
            <div className="relative">
              <Globe className="h-48 w-48 text-primary/20" />
              <Layers className="h-16 w-16 text-primary/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </section>

      {/* 9. Core Values */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Our Core Values</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Principles that guide our decisions, our code, and our culture.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {coreValues.map((value) => (
              <ValueCard key={value.title} value={value} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. Explore the Ecosystem */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">Explore More</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Explore the Baalvion Ecosystem
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every corner of TalentOS is built with the same mission in mind.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex items-start gap-4 p-5 rounded-lg border bg-card hover:border-primary/50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    {link.label}
                    {link.external && <ArrowRight className="h-4 w-4 rotate-[-45deg] opacity-60" />}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 11. CTA */}
      <section className="py-24 lg:py-32 text-center bg-muted/30">
        <div className="container mx-auto px-4">
          <Users className="h-12 w-12 text-primary/40 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Join Us in Building the Future
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Whether you&apos;re looking to join our team or partner with us, we&apos;re always seeking
            those who share our vision for a fairer, borderless world of work.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/careers/open-positions">
                View Open Roles <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Partner With Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
