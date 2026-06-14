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
  Globe,
  Zap,
  BookOpen,
  DollarSign,
  Heart,
  TrendingUp,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Full-Time Careers at Baalvion | TalentOS Global Hiring',
  description:
    'Join Baalvion full-time and build the future of global hiring with TalentOS. Remote-first, mission-driven roles with competitive compensation, learning budgets, and real ownership.',
  keywords: [
    'full-time jobs',
    'Baalvion careers',
    'TalentOS jobs',
    'remote full-time roles',
    'global hiring platform jobs',
    'tech careers India',
    'full-time remote work',
    'Baalvion Industries',
  ],
  alternates: {
    canonical: '/careers/full-time',
  },
  openGraph: {
    type: 'website',
    title: 'Full-Time Careers | TalentOS by Baalvion',
    description:
      'Build your career with Baalvion. Remote-first full-time roles where meritocracy meets global opportunity.',
    url: '/careers/full-time',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Full-Time Careers | TalentOS by Baalvion',
    description:
      'Build your career with Baalvion. Remote-first full-time roles where meritocracy meets global opportunity.',
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jobs.baalvion.com' },
    { '@type': 'ListItem', position: 2, name: 'Careers', item: 'https://jobs.baalvion.com/careers' },
    { '@type': 'ListItem', position: 3, name: 'Full-Time Roles', item: 'https://jobs.baalvion.com/careers/full-time' },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are full-time roles at Baalvion fully remote?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. Baalvion is a remote-first company. Full-time employees can work from anywhere in the world. Certain roles may have preferred time-zone overlap requirements for collaboration, which will be stated clearly in the job description.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which countries does Baalvion hire full-time employees from?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'We hire globally. Our TalentOS platform is built on the principle that skill transcends geography. We currently support employment in 40+ countries directly or through our trusted EOR (Employer of Record) partners. Check individual job listings for specific location requirements.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does the full-time application process look like?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'After you submit your application, our talent team reviews it within 5 business days. Shortlisted candidates complete a skills assessment, followed by two to three structured interviews — typically a recruiter screen, a technical or domain round, and a values and culture round. We aim to close the full process within three to four weeks.',
      },
    },
    {
      '@type': 'Question',
      name: 'What qualities does Baalvion look for in full-time hires?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'We evaluate on three dimensions: demonstrated skill in your domain, ownership mindset (you drive outcomes, not just tasks), and communication clarity. We value diverse backgrounds and career trajectories. We do not require credentials from specific institutions — results and growth trajectory matter most.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it typically take to hear back after applying?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Our talent team reviews every application within 5 business days. If you are shortlisted you will receive a calendar link for the first screen. If we are not moving forward, we send a respectful decline email — we do not ghost applicants.',
      },
    },
  ],
};

const benefits = [
  {
    icon: Globe,
    title: 'Global Remote-First',
    description:
      'Work from anywhere. Our distributed team spans 20+ countries and collaboration is designed for async-first productivity.',
  },
  {
    icon: Zap,
    title: 'Ownership & Impact',
    description:
      'You will own outcomes, not just tasks. Full-time team members drive product decisions and see their work ship to millions of candidates globally.',
  },
  {
    icon: BookOpen,
    title: 'Learning Budget',
    description:
      'Every full-time employee receives an annual learning and development budget for courses, conferences, books, and certifications.',
  },
  {
    icon: DollarSign,
    title: 'Competitive Compensation',
    description:
      'Market-benchmarked salaries with an equity-mindset approach. We share upside with the people who build what we are building.',
  },
  {
    icon: Heart,
    title: 'Health & Wellbeing',
    description:
      'Comprehensive health coverage, flexible leave policies including mental health days, and a no-meeting-Friday culture to protect deep work.',
  },
  {
    icon: TrendingUp,
    title: 'Career Growth',
    description:
      'Structured growth frameworks, internal mobility opportunities, and quarterly career conversations so you never wonder where you stand.',
  },
];

const hiringSteps = [
  {
    step: '01',
    title: 'Apply Online',
    description: 'Submit your application through TalentOS. No cover letter required — we focus on your work and skills.',
  },
  {
    step: '02',
    title: 'Talent Review',
    description: 'Our talent team reviews every application within 5 business days and reaches out to shortlisted candidates.',
  },
  {
    step: '03',
    title: 'Skills Assessment',
    description: 'A focused, async assessment relevant to your role — typically 60 to 90 minutes and completed on your schedule.',
  },
  {
    step: '04',
    title: 'Structured Interviews',
    description: 'Two to three interviews covering domain expertise, ownership scenarios, and a values alignment conversation.',
  },
  {
    step: '05',
    title: 'Offer & Onboarding',
    description: 'We move quickly once aligned. Offers are clear, documented, and followed by a structured 30-day onboarding plan.',
  },
];

const faqs = [
  {
    id: 'faq-1',
    question: 'Are full-time roles at Baalvion fully remote?',
    answer:
      'Yes. Baalvion is a remote-first company. Full-time employees can work from anywhere in the world. Certain roles may have preferred time-zone overlap requirements for collaboration, which will be stated clearly in the job description.',
  },
  {
    id: 'faq-2',
    question: 'Which countries does Baalvion hire full-time employees from?',
    answer:
      'We hire globally. We currently support employment in 40+ countries directly or through trusted EOR partners. Check individual job listings for specific location requirements.',
  },
  {
    id: 'faq-3',
    question: 'What does the application process look like?',
    answer:
      'After applying, our talent team reviews within 5 business days. Shortlisted candidates complete a skills assessment, followed by two to three structured interviews. We aim to close the full process within three to four weeks.',
  },
  {
    id: 'faq-4',
    question: 'What qualities does Baalvion look for?',
    answer:
      'We evaluate demonstrated skill in your domain, ownership mindset, and communication clarity. We value diverse backgrounds and trajectories. Results and growth matter more than credentials from specific institutions.',
  },
  {
    id: 'faq-5',
    question: 'How long does it take to hear back after applying?',
    answer:
      'Our team reviews every application within 5 business days. If shortlisted you receive a calendar link for the first screen. If we are not moving forward, we send a respectful decline email — we do not ghost applicants.',
  },
];

// Live job data is fetched per request; opt out of build-time prerendering so
// the build does not depend on the jobs API being reachable in CI.
export const dynamic = 'force-dynamic';

export default async function FullTimeRolesPage() {
  const [jobs, countries, departments] = await Promise.all([
    talentService.getJobs({ status: 'published', employmentType: 'Full-time' }),
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
            Full-Time Opportunities
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Build Your Career at Baalvion
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
            Join the team building TalentOS — the global hiring platform connecting exceptional
            talent with borderless opportunity. Full-time roles with real ownership, competitive
            compensation, and a remote-first culture.
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
              Why a full-time career at Baalvion?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              We believe the best work happens when talented people have autonomy, resources, and a
              mission worth caring about.
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

      {/* Open Positions */}
      <section id="open-positions" className="py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Open Full-Time Roles</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every role is remote-eligible unless otherwise specified.
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
                  No Full-Time Positions Available Currently
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

      <Separator />

      {/* Hiring Process */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Our Hiring Process</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Transparent, structured, and respectful of your time. No surprise steps, no ghosting.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {hiringSteps.map((item, index) => (
              <div key={item.step} className="relative">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <span className="text-4xl font-bold text-primary/20">{item.step}</span>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
                {index < hiringSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link href="/careers/hiring-process">Full Hiring Process Guide <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Answers to the questions we hear most often from full-time applicants.
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
              More questions?{' '}
              <Link href="/faqs" className="text-primary underline underline-offset-4 hover:no-underline">
                Visit our full FAQ page
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="text-primary underline underline-offset-4 hover:no-underline">
                contact our team
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Looking for something else + Related links */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Looking for something else?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We offer several engagement models to match where you are in your career.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Part-Time Roles</CardTitle>
                <CardDescription>
                  Flexible hours, real projects, and a pathway to full-time if that is your goal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/careers/part-time">Explore Part-Time</Link>
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
