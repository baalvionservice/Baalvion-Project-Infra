import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Globe,
  Heart,
  Scale,
  Search,
  ShieldCheck,
  Users,
  CheckCircle,
  Accessibility,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Diversity, Equity & Inclusion | TalentOS by Baalvion",
  description:
    "Baalvion's DEI commitment: bias-reduced AI hiring, global access, pay equity, and inclusive product design. Building technology that widens opportunity for every candidate.",
  keywords: [
    "diversity equity inclusion hiring",
    "bias-reduced recruitment",
    "inclusive hiring technology",
    "Baalvion DEI",
    "TalentOS accessibility",
    "equitable talent acquisition",
    "global borderless hiring",
    "blind screening AI",
  ],
  alternates: {
    canonical: "/about/diversity",
  },
  openGraph: {
    title: "Diversity, Equity & Inclusion | TalentOS by Baalvion",
    description:
      "How Baalvion builds bias-reduced hiring technology and maintains its commitment to global access, pay equity, and belonging for every candidate and team member.",
    url: "/about/diversity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diversity, Equity & Inclusion | TalentOS by Baalvion",
    description:
      "Bias-reduced AI hiring, global access, pay equity, and inclusive design. DEI is not a program at Baalvion—it is the product.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does TalentOS reduce hiring bias?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TalentOS uses structured, skill-based scoring that evaluates candidates against defined competencies rather than inferred demographic signals. Blind screening modes can suppress name, photo, and location fields during the initial review stage, ensuring evaluators respond to capability first.",
      },
    },
    {
      "@type": "Question",
      name: "Can employers use TalentOS to hire across different countries?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. TalentOS is built for cross-border hiring from day one, with multi-region compliance infrastructure and support for currency, locale, and labor-regulation variance across 50+ countries. Borderless access is a core architectural principle, not an add-on.",
      },
    },
    {
      "@type": "Question",
      name: "Is TalentOS accessible for candidates with disabilities?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We target WCAG 2.1 AA conformance across the candidate-facing product surface, including keyboard navigation, sufficient color contrast, screen-reader-compatible form flows, and reduced-motion support. Accessibility is treated as a functional requirement, not a release-phase audit.",
      },
    },
    {
      "@type": "Question",
      name: "How does Baalvion approach pay equity internally?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Baalvion uses structured compensation bands tied to role scope and skill level, not negotiation history or prior salary. We conduct bi-annual pay equity reviews to identify and correct systemic disparities before they compound.",
      },
    },
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
    {
      "@type": "ListItem",
      position: 3,
      name: "Diversity & Inclusion",
      item: "https://jobs.baalvion.com/about/diversity",
    },
  ],
};

type DeiPillar = {
  icon: React.ReactNode;
  title: string;
  description: string;
  detail: string;
};

const deiPillars: DeiPillar[] = [
  {
    icon: <Eye className="h-6 w-6" />,
    title: "Bias-Reduced Hiring",
    description: "Structured evaluation that separates capability from circumstance.",
    detail:
      "Our scoring rubrics are designed around explicitly defined role competencies, not implicit proxies. Blind review modes, structured interview scorecards, and calibration tooling reduce the surface area where unconscious bias enters the decision.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global & Borderless Access",
    description: "Equal opportunity regardless of geography or passport.",
    detail:
      "TalentOS serves candidates and employers across 50+ countries. We are building infrastructure that makes geographic origin irrelevant to opportunity—multi-region compliance, multi-currency support, and locale-aware workflows by default.",
  },
  {
    icon: <Accessibility className="h-6 w-6" />,
    title: "Accessibility & Inclusive Design",
    description: "A product that works for every candidate, not just the majority.",
    detail:
      "We target WCAG 2.1 AA conformance across all candidate-facing surfaces. This means keyboard navigation throughout, adequate color contrast, screen-reader-compatible form flows, reduced-motion support, and plain-language microcopy that does not assume familiarity with corporate HR jargon.",
  },
  {
    icon: <Scale className="h-6 w-6" />,
    title: "Pay Equity & Transparency",
    description: "Compensation grounded in role scope and skill, not negotiation leverage.",
    detail:
      "Internally, Baalvion uses structured compensation bands that are decoupled from negotiation history or prior salary—both demonstrated vectors of systemic pay inequity. We conduct bi-annual pay equity reviews and commit to correcting identified disparities.",
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Belonging & Community",
    description: "An environment where every team member can contribute fully.",
    detail:
      "Belonging is the outcome we actually care about, not the appearance of diversity. We invest in psychological safety, async-first communication that reduces real-time exclusion, and active listening structures in team decision-making.",
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "Inclusive Sourcing",
    description: "Widening the top of the funnel before the algorithm runs.",
    detail:
      "Diverse outcomes require diverse inputs. We partner with organizations that connect underrepresented talent to opportunity, and we audit job description language for exclusionary phrasing before postings go live.",
  },
];

type TechBiasPoint = {
  title: string;
  description: string;
};

const techBiasPoints: TechBiasPoint[] = [
  {
    title: "Skill-Based Matching",
    description:
      "Candidates are scored against explicitly defined role competencies—not inferred signals like institution prestige, company brand recognition, or location. The match model rewards demonstrable ability.",
  },
  {
    title: "Structured Scoring Rubrics",
    description:
      "Every role uses a consistent evaluation framework shared across all reviewers. Structured interviews with pre-set scoring criteria outperform unstructured conversations in predictive accuracy and equity.",
  },
  {
    title: "Blind Screening Modes",
    description:
      "Employers can suppress name, photograph, age indicators, and location fields during the initial screening pass, ensuring that early-funnel decisions are driven by capability signals rather than demographic ones.",
  },
  {
    title: "Transparent, Auditable Rankings",
    description:
      "TalentOS does not produce black-box rankings. Every candidate score includes a rationale breakdown—which competencies matched, which had gaps, and at what weight. Employers can inspect and override. Accountability requires visibility.",
  },
];

type RelatedLink = {
  href: string;
  label: string;
  description: string;
  external?: boolean;
};

const relatedLinks: RelatedLink[] = [
  { href: "/about", label: "About Baalvion", description: "Mission, vision, and platform overview" },
  { href: "/about/team", label: "Our Team", description: "The people building TalentOS" },
  { href: "/careers/open-positions", label: "Open Roles", description: "We are hiring — see our current positions" },
  { href: "/careers/life-at-baalvion", label: "Life at Baalvion", description: "Culture, benefits, and day-to-day" },
  { href: "/careers/hiring-process", label: "Hiring Process", description: "What to expect when you apply" },
  {
    href: "https://www.baalvion.com",
    label: "Baalvion Corporate",
    description: "Our parent company and broader mission",
    external: true,
  },
];

const faqItems = [
  {
    id: "item-1",
    question: "How does TalentOS reduce hiring bias?",
    answer:
      "TalentOS uses structured, skill-based scoring that evaluates candidates against defined competencies rather than inferred demographic signals. Blind screening modes can suppress name, photo, and location fields during the initial review stage, ensuring evaluators respond to capability first. Every score includes a rationale breakdown that can be inspected and audited.",
  },
  {
    id: "item-2",
    question: "Can employers use TalentOS to hire across different countries?",
    answer:
      "Yes. TalentOS is built for cross-border hiring from day one, with multi-region compliance infrastructure and support for currency, locale, and labor-regulation variance across 50+ countries. Borderless access is a core architectural principle, not an add-on feature.",
  },
  {
    id: "item-3",
    question: "Is TalentOS accessible for candidates with disabilities?",
    answer:
      "We target WCAG 2.1 AA conformance across the candidate-facing product surface, including keyboard navigation, sufficient color contrast, screen-reader-compatible form flows, and reduced-motion support. Accessibility is treated as a functional requirement throughout our engineering process, not a release-phase audit.",
  },
  {
    id: "item-4",
    question: "How does Baalvion approach pay equity internally?",
    answer:
      "Baalvion uses structured compensation bands tied to role scope and skill level, not negotiation history or prior salary—both of which are demonstrated vectors of pay inequity. We conduct bi-annual pay equity reviews to identify and correct systemic disparities before they compound over time.",
  },
];

function DeiPillarCard({ pillar }: { pillar: DeiPillar }) {
  return (
    <Card className="bg-background h-full">
      <CardHeader>
        <div className="bg-primary/10 text-primary p-3 rounded-md w-fit mb-2">
          {pillar.icon}
        </div>
        <CardTitle className="text-xl">{pillar.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-medium text-foreground">{pillar.description}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{pillar.detail}</p>
      </CardContent>
    </Card>
  );
}

export default function DiversityPage() {
  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
          <li>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground font-medium">Diversity &amp; Inclusion</li>
        </ol>
      </nav>

      {/* 1. Hero */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">Our DEI Commitment</Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Diversity, Equity<br className="hidden md:block" /> &amp; Inclusion
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            At Baalvion, DEI is not a program running alongside our product.
            It is built into the architecture of TalentOS itself.
          </p>
        </div>
      </section>

      <Separator />

      {/* 2. Opening Commitment */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Our commitment is structural, not decorative.
            </h2>
          </div>
          <div className="space-y-4 text-lg text-muted-foreground">
            <p>
              Our mission is to create a fair, intelligent, and transparent ecosystem where
              skill is the only currency that matters. That mission begins with us. We are
              committed to building a diverse and inclusive workplace where all team members
              feel valued, respected, and empowered.
            </p>
            <p>
              We believe diverse teams build better products, make better decisions, and better
              reflect the global community of talent we serve. This page describes what that
              commitment means in practice—in our product, in our hiring, and in our culture.
            </p>
            <p>
              We welcome applicants from all backgrounds, experiences, and identities. We
              actively audit our own processes for the same biases we help employers eliminate.
            </p>
          </div>
        </div>
      </section>

      {/* 3. DEI Pillars */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">Six Pillars</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              What DEI looks like at Baalvion
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Concrete commitments, not aspirational language.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deiPillars.map((pillar) => (
              <DeiPillarCard key={pillar.title} pillar={pillar} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. How Technology Reduces Bias */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="md:sticky md:top-8">
              <Badge variant="secondary" className="mb-4">Product Design</Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                How our technology reduces bias
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                TalentOS is designed from the ground up to minimize the surface area where
                bias enters hiring decisions. These are not aspirational features—they are
                core to how the matching and scoring engine works.
              </p>
              <div className="mt-8">
                <Button asChild size="lg">
                  <Link href="/careers/open-positions">
                    See It in Practice <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-6">
              {techBiasPoints.map((point, index) => (
                <div key={point.title} className="flex items-start gap-4 p-6 rounded-lg border bg-card">
                  <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center shrink-0 text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{point.title}</h3>
                    <p className="mt-1 text-muted-foreground">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Accessibility Commitment */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <div className="bg-primary/10 rounded-2xl p-12">
              <ShieldCheck className="h-24 w-24 text-primary" />
            </div>
          </div>
          <div>
            <Badge variant="secondary" className="mb-4">Accessibility</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Designed for every candidate
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A fair hiring platform must be usable by every candidate. We target WCAG 2.1 AA
              conformance across all candidate-facing surfaces—not as a compliance checkbox,
              but because access to opportunity should not depend on ability or assistive technology.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Full keyboard navigation across application flows",
                "Screen-reader-compatible form inputs and error states",
                "Color contrast meeting or exceeding 4.5:1 for body text",
                "Reduced-motion support for animations and transitions",
                "Plain-language microcopy, free of HR and tech jargon",
                "Mobile-first responsive design for low-bandwidth environments",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Common Questions</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">DEI FAQs</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Honest answers to the questions we get most often.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-semibold text-base hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-8 text-center text-muted-foreground">
            Have another question?{" "}
            <Link href="/faqs" className="text-primary underline-offset-4 hover:underline">
              Visit our full FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
              contact us directly
            </Link>.
          </p>
        </div>
      </section>

      {/* 7. Related Links */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="secondary" className="mb-4">Explore More</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Continue exploring TalentOS
            </h2>
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

      {/* 8. CTA */}
      <section className="py-24 lg:py-32 text-center">
        <div className="container mx-auto px-4">
          <Users className="h-12 w-12 text-primary/40 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Be part of what we&apos;re building
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            We hire for skill, potential, and perspective. If our mission resonates with you,
            we&apos;d like to hear from you—wherever you are in the world.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/careers/open-positions">
                View Open Roles <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about/team">Meet the Team</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
