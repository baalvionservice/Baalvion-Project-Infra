import { Metadata } from 'next';
import { talentService } from '@/services/talent.service';
import { JobCard } from '@/modules/talent-acquisition/components/JobCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';
import {
  Clock,
  Globe,
  Layers,
  Lightbulb,
  ArrowUpRight,
  GraduationCap,
  Briefcase,
  Users,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Part-Time Jobs at Baalvion | Flexible Remote Work | TalentOS',
  description:
    'Explore flexible part-time roles at Baalvion Industries. Work on meaningful global projects, grow your skills, and choose hours that fit your life — remote-first, globally accessible.',
  keywords: [
    'part-time remote jobs',
    'flexible work Baalvion',
    'TalentOS part-time',
    'remote part-time hiring',
    'part-time tech jobs',
    'flexible remote roles',
    'Baalvion part-time careers',
    'global part-time opportunities',
  ],
  alternates: {
    canonical: '/careers/part-time',
  },
  openGraph: {
    type: 'website',
    title: 'Part-Time Roles | TalentOS by Baalvion',
    description:
      'Flexible, remote part-time roles at Baalvion. Meaningful projects, skill growth, and a pathway to full-time — work on your terms.',
    url: '/careers/part-time',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Part-Time Roles | TalentOS by Baalvion',
    description:
      'Flexible, remote part-time roles at Baalvion. Meaningful projects, skill growth, and a pathway to full-time — work on your terms.',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jobs.baalvion.com' },
    { '@type': 'ListItem', position: 2, name: 'Careers', item: 'https://jobs.baalvion.com/careers' },
    { '@type': 'ListItem', position: 3, name: 'Part-Time Roles', item: 'https://jobs.baalvion.com/careers/part-time' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How many hours per week are part-time roles at Baalvion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Part-time roles at Baalvion typically range from 15 to 25 hours per week. The exact hours and scheduling flexibility are specified in each job listing. We are outcomes-focused, so many roles offer significant flexibility in when you work, as long as there is a reasonable overlap window for team collaboration.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are part-time roles at Baalvion remote?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. All part-time roles are remote-eligible. Baalvion is a remote-first organisation and our tools, culture, and processes are built for distributed teams. There are no physical office requirements for part-time positions.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does compensation work for part-time roles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Part-time roles are compensated on a pro-rated basis relative to our full-time salary bands. We benchmark compensation to market rates globally. Pay is denominated in USD or local currency depending on your location and engagement structure.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can a part-time role convert to full-time at Baalvion?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. Many of our full-time team members started in part-time or contract capacities. We have a structured pathway: after 3 months of strong performance in a part-time role, you become eligible for consideration for available full-time positions. Your part-time tenure counts toward your employment history with us.',
      },
    },
    {
      '@type': 'Question',
      name: 'Who is a part-time role at Baalvion a good fit for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Part-time roles are ideal for students completing degrees, freelancers who want stable project work alongside their client base, parents or caregivers balancing work and family, and professionals building a portfolio in a new domain. We welcome anyone who brings skill and commitment, regardless of their employment situation.',
      },
    },
  ],
};

const benefits = [
  {
    icon: Clock,
    title: 'Flexible Hours',
    description:
      'Choose when you work within a reasonable collaboration window. We are outcomes-focused — your output matters more than when you clock in.',
  },
  {
    icon: Globe,
    title: 'Fully Remote',
    description:
      'Every part-time role is remote-eligible. Work from home, a co-working space, or anywhere with a reliable connection.',
  },
  {
    icon: Layers,
    title: 'Meaningful Projects',
    description:
      'Part-time contributors work on real product and platform initiatives — not filler tasks. Your work ships to real users.',
  },
  {
    icon: Lightbulb,
    title: 'Skill Growth',
    description:
      "Access to Baalvion's learning resources and a team of experienced practitioners to grow alongside, even at 20 hours a week.",
  },
  {
    icon: ArrowUpRight,
    title: 'Pathway to Full-Time',
    description:
      'After 3 months of strong performance, part-time contributors are eligible for full-time openings. Many of our full-timers started exactly here.',
  },
];

const whoItsFor = [
  {
    icon: GraduationCap,
    title: 'Students',
    description:
      'Build real-world experience alongside your degree. Part-time schedules adapt around coursework and exams.',
  },
  {
    icon: Briefcase,
    title: 'Freelancers',
    description:
      'Add stable, recurring project work to your client portfolio. Consistent scope, consistent pay.',
  },
  {
    icon: Users,
    title: 'Parents & Caregivers',
    description:
      'Re-enter the workforce or maintain momentum on your own terms with hours that fit your responsibilities.',
  },
  {
    icon: Layers,
    title: 'Portfolio Career Builders',
    description:
      'Professionals exploring a new domain or growing a side practice while keeping existing commitments.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Apply & Skills Review',
    description: 'Submit your application. Our talent team reviews and responds within 5 business days.',
  },
  {
    step: '02',
    title: 'Intro Call',
    description: 'A 30-minute conversation to align on the role scope, hours, and your availability.',
  },
  {
    step: '03',
    title: 'Skills Assessment',
    description: 'A focused async task — usually under 60 minutes — relevant to the role you applied for.',
  },
  {
    step: '04',
    title: 'Final Interview',
    description: 'One structured conversation with the hiring manager to confirm mutual fit.',
  },
  {
    step: '05',
    title: 'Offer & Onboarding',
    description: 'Clear offer documentation and a lightweight 2-week onboarding to get you productive fast.',
  },
];

const faqs = [
  {
    id: 'faq-1',
    question: 'How many hours per week are part-time roles?',
    answer:
      'Typically 15 to 25 hours per week. The exact hours and scheduling flexibility are specified in each job listing. We are outcomes-focused, so many roles offer significant flexibility in when you work, as long as there is a reasonable overlap window for team collaboration.',
  },
  {
    id: 'faq-2',
    question: 'Are part-time roles at Baalvion remote?',
    answer:
      'Yes. All part-time roles are remote-eligible. Baalvion is a remote-first organisation and our tools, culture, and processes are built for distributed teams. There are no physical office requirements for part-time positions.',
  },
  {
    id: 'faq-3',
    question: 'How does compensation work for part-time roles?',
    answer:
      'Part-time roles are compensated on a pro-rated basis relative to our full-time salary bands. We benchmark compensation to global market rates. Pay is denominated in USD or local currency depending on your location and engagement structure.',
  },
  {
    id: 'faq-4',
    question: 'Can a part-time role convert to full-time?',
    answer:
      'Yes. After 3 months of strong performance in a part-time role, you become eligible for consideration for available full-time positions. Your part-time tenure counts toward your employment history with us.',
  },
  {
    id: 'faq-5',
    question: 'Who is a part-time role at Baalvion a good fit for?',
    answer:
      'Part-time roles are ideal for students completing degrees, freelancers who want stable project work, parents or caregivers balancing work and family, and professionals building a portfolio in a new domain. We welcome anyone who brings skill and commitment.',
  },
];

export default async function PartTimeRolesPage() {
  const [jobs, countries, departments] = await Promise.all([
    talentService.getJobs({ status: 'published', employmentType: 'Part-time' }),
    talentService.getCountries({ isActive: true }),
    talentService.getDepartments({ isActive: true }),
  ]);

  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            Flexible Opportunities
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Part-Time Roles at Baalvion
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            Work on meaningful global projects at hours that fit your life. Our part-time roles
            offer real impact, flexible schedules, and a clear pathway to full-time if that is where
            you are headed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <a href="#open-positions">View Open Roles</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/careers/hiring-process">How We Hire</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Why a part-time role at Baalvion?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Flexible work should not mean less meaningful work. Our part-time contributors are
              core to what we build.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="border bg-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Who It's For */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Who is this for?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Our part-time roles are designed for driven people at different stages of their career
              and life.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {whoItsFor.map((profile) => {
              const Icon = profile.icon;
              return (
                <Card key={profile.title} className="text-center">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{profile.title}</h3>
                    <p className="text-sm text-muted-foreground">{profile.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Open Positions */}
      <section id="open-positions" className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Open Part-Time Roles
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              All roles are remote-eligible and flexible. Hours are specified per listing.
            </p>
          </div>
          {jobs.data.length > 0 ? (
            <div className="space-y-6">
              {jobs.data.map((job: any) => (
                <JobCard
                  key={job.id}
                  job={job}
                  departments={departments}
                  countries={countries}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-semibold">
                  No Part-Time Positions Available Currently
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Please check our global listings for all open opportunities.
                </p>
                <Button variant="default" className="mt-4" asChild>
                  <Link href="/careers/open-positions">View All Roles</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="mt-10 text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/careers/open-positions">See All Open Positions</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              A streamlined, respectful process — typically two to three weeks from application to
              offer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <span className="text-4xl font-bold text-primary/20">{item.step}</span>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
                {index < howItWorks.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link href="/careers/hiring-process">
                Full Hiring Process Guide <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Common questions from part-time applicants, answered honestly.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Still have questions?{' '}
              <Link href="/faqs" className="text-primary underline underline-offset-4 hover:no-underline">
                Browse our full FAQ
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="text-primary underline underline-offset-4 hover:no-underline">
                get in touch
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Looking for something else + Related links */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Looking for something else?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We offer multiple engagement models — find the one that fits where you are right now.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Full-Time Roles</CardTitle>
                <CardDescription>
                  Ownership, competitive compensation, and a full suite of benefits for career-builders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/careers/full-time">Explore Full-Time</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Internship Program</CardTitle>
                <CardDescription>
                  Structured 3–6 month programmes for students and recent graduates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/careers/internship-program">Explore Internships</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Life at Baalvion</CardTitle>
                <CardDescription>
                  Culture, values, and what it is actually like to work here every day.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/careers/life-at-baalvion">Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-16" />

          {/* Related links */}
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-tight mb-6">Explore More</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { href: '/careers', label: 'All Careers' },
                { href: '/careers/open-positions', label: 'All Open Positions' },
                { href: '/placement', label: 'Placement Services' },
                { href: '/about', label: 'About Baalvion' },
                { href: '/login', label: 'Candidate Login' },
                { href: '/register', label: 'Create Account' },
              ].map((link) => (
                <Button key={link.href} variant="ghost" size="sm" asChild>
                  <Link href={link.href}>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {link.label}
                  </Link>
                </Button>
              ))}
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://www.baalvion.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="mr-1 h-3 w-3" />
                  Baalvion Corporate
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
