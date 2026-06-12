import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Check,
  Zap,
  ArrowRight,
  Users,
  Star,
  BookOpen,
  Award,
  Globe,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Performance-Based Tech Internship in India | Paid Internship with Stipend | Baalvion',
  description:
    'Apply to Baalvion\'s paid tech internship in India — ₹40,000–₹90,000/month stipend, 6 tracks, PPO pathway. Software, data, design, and product roles for students and recent grads.',
  keywords: [
    'tech internship India',
    'paid internship India',
    'software internship with stipend',
    'internship to full time',
    'data science internship India',
    'product management internship',
    'PPO internship India',
    'Baalvion internship program',
    'TalentOS internship',
    'engineering internship Bangalore',
    'performance based internship',
    'final year internship India',
  ],
  alternates: {
    canonical: '/careers/internship-program',
  },
  openGraph: {
    title: 'Paid Tech Internship in India | Baalvion TalentOS',
    description:
      'Merit-driven internship with ₹40,000–₹90,000/month stipend, 6 specialization tracks, and a direct PPO pathway to a full-time role.',
    url: '/careers/internship-program',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Paid Tech Internship in India | Baalvion',
    description:
      'Performance-based internship with real stipend, real ownership, and a clear path to full-time at Baalvion.',
  },
};

const specializations = [
  'Full-Stack Engineering (React, Go)',
  'Cloud & DevOps Engineering (AWS, Kubernetes)',
  'Data Science & Machine Learning',
  'Product Management',
  'UX/UI Design',
  'Talent Acquisition & HR Tech',
];

const competencies = [
  'Technical Proficiency',
  'Problem-Solving & Critical Thinking',
  'Ownership & Accountability',
  'Communication & Collaboration',
  'Adaptability & Learning Agility',
];

const eligibilityGroups = [
  {
    icon: BookOpen,
    label: 'Final-Year Students',
    description:
      'B.Tech, M.Tech, MBA, or equivalent final-year students at any recognized Indian institution.',
  },
  {
    icon: Award,
    label: 'Recent Graduates',
    description:
      'Graduates within the past 12 months who have not yet held a full-time industry role.',
  },
  {
    icon: Users,
    label: 'Career Switchers',
    description:
      'Professionals transitioning into tech, product, or design who can demonstrate foundational skills through projects or coursework.',
  },
  {
    icon: Star,
    label: 'Open Source Contributors',
    description:
      'Self-taught candidates with a strong portfolio, significant open source contributions, or demonstrable side-project history.',
  },
];

const selectionSteps = [
  {
    step: '01',
    title: 'Online Application',
    description:
      'Submit your application with resume, a link to your best work (GitHub, portfolio, or case study), and a short note on which track you are applying for.',
  },
  {
    step: '02',
    title: 'Technical Screen',
    description:
      'A focused 45-minute async technical assessment tailored to your chosen specialization — code problem, product case, or design challenge.',
  },
  {
    step: '03',
    title: 'Live Problem Session',
    description:
      'A 60-minute live session with a Baalvion engineer or domain expert. We evaluate depth of thinking, not just correctness.',
  },
  {
    step: '04',
    title: 'Culture & Values Interview',
    description:
      'A 30-minute conversation about ownership, meritocracy, and how you approach ambiguity. No trick questions — we want to understand how you think.',
  },
  {
    step: '05',
    title: 'Offer & Onboarding',
    description:
      'Selected candidates receive an offer within 5 business days. Onboarding is structured, week-one is intensive, and you own real work from day two.',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Real Ownership',
    description:
      'You work on production features and live infrastructure — not sandbox projects. Your commits ship.',
  },
  {
    icon: Users,
    title: 'Senior Mentorship',
    description:
      'Each intern is paired with a senior engineer or domain lead who reviews work weekly and invests in your growth.',
  },
  {
    icon: ClipboardList,
    title: 'Monthly Performance Reviews',
    description:
      'Clear, written feedback every month tied directly to your stipend tier. No surprises, no ambiguity.',
  },
  {
    icon: Award,
    title: 'PPO Pathway',
    description:
      'Consistently high performers receive a Pre-Placement Offer before the internship concludes. The bar is high; the opportunity is real.',
  },
  {
    icon: Globe,
    title: 'Global Exposure',
    description:
      'Work with a globally distributed team and contribute to a platform serving talent and employers across 30+ countries.',
  },
  {
    icon: Star,
    title: 'Completion Certificate',
    description:
      'All interns receive a verified Baalvion certificate of completion. Top performers receive a performance excellence endorsement.',
  },
];

const faqs = [
  {
    question: 'What is the stipend and how is it determined?',
    answer:
      'The monthly stipend ranges from ₹40,000 to ₹90,000, determined by your performance tier. At the end of each month, your mentor and team lead assess your output against the core competency framework. Strong performers move up; there is no ceiling if you are consistently at the top.',
  },
  {
    question: 'How long is the internship program?',
    answer:
      'The standard internship duration is 3 to 6 months. Final-year students completing a semester-long internship typically join for the full 6-month cycle. The exact duration is confirmed at offer stage based on your availability and track.',
  },
  {
    question: 'Is the internship remote, hybrid, or on-site?',
    answer:
      'The program is primarily hybrid, based at our India headquarters. Interns are expected on-site at least 3 days per week. Certain tracks (Data Science, UX/UI Design) may have more flexible arrangements — confirm with the hiring team at offer stage.',
  },
  {
    question: 'Who is eligible to apply?',
    answer:
      'Final-year students, recent graduates (within 12 months of graduation), career switchers, and self-taught candidates with a demonstrable portfolio. We do not screen by institution or CGPA — we screen by demonstrated skill and potential.',
  },
  {
    question: 'What is the PPO conversion rate?',
    answer:
      'We do not publish a fixed conversion rate because we do not run the program to fill a quota. Every intern who consistently exceeds expectations receives an offer. Historically, roughly 40–60% of interns who complete the program receive a PPO. The program is designed so that the offer is genuinely earnable by anyone who performs.',
  },
  {
    question: 'How do I apply?',
    answer:
      'Apply via the open positions page — filter by job type "Internship" to see all available tracks. Each listing shows the current intake window. Applications are reviewed on a rolling basis; earlier applications receive earlier feedback.',
  },
];

const relatedLinks = [
  { href: '/careers/full-time', label: 'Full-Time Roles' },
  { href: '/careers/part-time', label: 'Part-Time Roles' },
  { href: '/placement', label: 'Placement Programs' },
  { href: '/careers/hiring-process', label: 'Our Hiring Process' },
  { href: '/about', label: 'About Baalvion' },
];

export default function InternshipProgramPage() {
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
        name: 'Careers',
        item: 'https://jobs.baalvion.com/careers',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Internship Program',
        item: 'https://jobs.baalvion.com/careers/internship-program',
      },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

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
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge variant="outline" className="mb-4">
            India — Hybrid
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Performance-Based Internship Program
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            A merit-driven launchpad for the next generation of tech leaders.
            Real stipend. Real ownership. A clear path to a full-time role.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/careers/open-positions?jobType=Internship">
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/careers/hiring-process">How We Hire</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
            <span className="font-semibold text-foreground text-base">
              ₹40,000 – ₹90,000 / month
            </span>
            <span>6 Specialization Tracks</span>
            <span>3 – 6 Month Duration</span>
            <span>PPO Pathway</span>
          </div>
        </div>
      </section>

      {/* Program Philosophy */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Meritocracy in Action
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Our internship is not a typical program. It is an extended,
            high-stakes evaluation designed to identify and cultivate top-tier
            talent. Your compensation, responsibilities, and pathway to a
            full-time role are directly tied to your demonstrated competency and
            impact — not your institution, your CGPA, or how long you have been
            here.
          </p>
        </div>
      </section>

      {/* Who Should Apply */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Who Should Apply
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We evaluate skill and potential, not pedigree. If you can do the
              work and demonstrate the drive, you are eligible.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {eligibilityGroups.map((group) => {
              const Icon = group.icon;
              return (
                <Card key={group.label} className="bg-card">
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{group.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {group.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 Specialization Tracks */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-12">
            6 Specialization Tracks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {specializations.map((track) => (
              <Card key={track} className="bg-card">
                <CardContent className="p-6 flex items-center gap-4">
                  <Zap className="h-6 w-6 text-primary shrink-0" />
                  <span className="font-semibold">{track}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Competency + Compensation */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Core Competency Framework
            </h2>
            <p className="text-muted-foreground mb-6 text-lg">
              You will be rigorously assessed against our five core
              competencies. Mastery in these areas is non-negotiable for
              progressing within Baalvion.
            </p>
            <ul className="space-y-4">
              {competencies.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1 shrink-0" />
                  <span className="text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Performance-Based Compensation</CardTitle>
              <CardDescription>
                Your stipend reflects your impact. Reviewed every month.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Your monthly stipend is determined by your performance tier,
                reviewed at the end of each month. Exceptional impact is
                rewarded immediately — there is no waiting period.
              </p>
              <div className="text-center p-6 border rounded-lg bg-background">
                <p className="text-sm text-muted-foreground">Stipend Range</p>
                <p className="text-3xl font-bold mt-1">
                  ₹40,000 – ₹90,000 / month
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on monthly performance review · India headquarters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What You'll Get */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              What You Will Get
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Beyond the stipend — here is what makes a Baalvion internship
              genuinely different.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="bg-card">
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selection Process */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Selection Process
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our process is designed to be rigorous, fair, and fast. Most
              candidates hear back within 2 weeks of applying.
            </p>
          </div>
          <ol className="space-y-8">
            {selectionSteps.map((item) => (
              <li key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PPO Pathway */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Pathway to a Full-Time Role
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            This is not just an internship — it is your interview for a
            full-time position. Interns who consistently exceed expectations
            and demonstrate mastery of our core competencies receive a
            Pre-Placement Offer (PPO) to join Baalvion as a full-time employee
            upon graduation. The bar is high. The opportunity is real.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/careers/open-positions?jobType=Internship">
                Apply to the Internship Program{' '}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
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
              Everything you need to know before you apply.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Still have questions?{' '}
              <Link
                href="/faqs"
                className="text-primary underline underline-offset-4"
              >
                Visit our full FAQ
              </Link>{' '}
              or{' '}
              <Link
                href="/contact"
                className="text-primary underline underline-offset-4"
              >
                contact our hiring team
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold tracking-tight">
              Explore More at Baalvion
            </h2>
            <p className="mt-3 text-muted-foreground">
              Looking for other opportunities or want to learn more?
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
                Baalvion Corporate Site{' '}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
