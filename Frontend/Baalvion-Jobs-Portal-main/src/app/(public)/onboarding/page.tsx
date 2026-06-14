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
import {
  Building2,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Join Baalvion — College & Student Onboarding',
  description:
    'Onboard your college or join as a student in minutes. Baalvion connects verified institutions and students with a global network of recruiters through a transparent, merit-based placement platform.',
  alternates: { canonical: '/onboarding' },
  openGraph: {
    title: 'Join Baalvion — College & Student Onboarding | TalentOS',
    description:
      'Colleges and students can self-onboard to the Baalvion talent network in minutes — no paperwork bottlenecks, fully transparent, completely free for students.',
    url: '/onboarding',
  },
};

const howItWorks = [
  {
    icon: <Sparkles className="h-6 w-6 text-primary" />,
    title: 'Apply online',
    description:
      'Fill a short form — institutional details for colleges, academic profile for students. No documents to chase upfront.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: 'We verify',
    description:
      'Our team verifies accreditation and identity to keep the network trustworthy and fraud-free for every recruiter.',
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
    title: 'Go live',
    description:
      'Approved colleges get a placement dashboard; approved students appear in recruiter searches and receive matched roles.',
  },
];

const onboardingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to join the Baalvion talent network',
  description:
    'Self-onboarding for colleges and students onto the Baalvion (TalentOS) campus placement platform.',
  step: howItWorks.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.title,
    text: step.description,
  })),
};

export default function OnboardingHubPage() {
  return (
    <main className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(onboardingJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20 px-6 text-center">
        <div className="container mx-auto">
          <Badge variant="secondary" className="mb-4">
            Baalvion TalentOS · Onboarding
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Become part of Baalvion
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-3xl mx-auto opacity-90">
            Whether you run a college placement cell or you&apos;re a student ready to
            launch your career, onboarding takes minutes. Verified, transparent, and free
            for every student.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/onboarding/college">Onboard your college</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/onboarding/student">Join as a student</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Two paths */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* College */}
            <Card className="flex flex-col border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    Colleges &amp; Universities
                  </Badge>
                </div>
                <CardTitle className="text-2xl">Onboard your placement cell</CardTitle>
                <CardDescription>
                  Move your placements off spreadsheets. Get a verified, analytics-ready
                  placement system and direct access to a national recruiter network.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {[
                    'Real-time placement analytics for your institution',
                    'Verified student profiles and document checks',
                    'Access to recruiters hiring across every sector',
                    'A dedicated placement dashboard once approved',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full">
                  <Link href="/onboarding/college">
                    Start college onboarding <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Student */}
            <Card className="flex flex-col border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge variant="outline" className="text-purple-600 border-purple-300">
                    Students
                  </Badge>
                </div>
                <CardTitle className="text-2xl">Join as a student</CardTitle>
                <CardDescription>
                  Build a verified profile, get matched to internships and full-time roles,
                  and receive real offers — judged on your skills, not your pedigree.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {[
                    'One profile, every Baalvion role across countries',
                    'AI-matched recommendations based on your skills',
                    'Internship-to-placement pathway with tracked progress',
                    'Always free — students never pay a platform fee',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full">
                  <Link href="/onboarding/student">
                    Start student onboarding <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How onboarding works</h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
              A simple three-step path from application to going live on the platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((step, index) => (
              <Card key={step.title} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-3">{step.icon}</div>
                  <CardTitle className="text-lg">
                    <span className="text-muted-foreground mr-2">{index + 1}.</span>
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
            <Clock className="h-4 w-4" /> Most applications are reviewed within 5–7 business days.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">Already onboarded?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Sign in to your dashboard, or explore the verified campus placement program
            before you commit.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/placement">See campus placements</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
