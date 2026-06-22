import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ShieldCheck, Mail, Clock, Building2, Home, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Thank You — Application Received | Baalvion Investor Relations',
  description: 'Your request for institutional investor access has been received and is under review by the Baalvion Investor Relations team.',
  robots: { index: false, follow: false },
  alternates: { canonical: '/onboarding/thank-you' },
};

// Post-submission landing. Reached after the onboarding funnel successfully creates an application.
// `?ref=BV-XXXXXX` is the human-friendly application reference returned by ir-service.
export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  const steps = [
    {
      icon: ShieldCheck,
      title: 'We review your application',
      body: 'Our Investor Relations team verifies your accreditation and eligibility under applicable private-placement rules.',
    },
    {
      icon: Mail,
      title: 'You receive an approval email',
      body: 'On approval, we email secure portal credentials to the address on your application. Watch your inbox (and spam folder).',
    },
    {
      icon: Building2,
      title: 'Corporate email required for deal rooms',
      body: 'Live deal rooms are reserved for applicants who registered with a company (corporate) email address — not a personal one.',
    },
    {
      icon: Clock,
      title: 'A short 5-minute security hold',
      body: 'Once approved, deal-room access unlocks 5 minutes after approval. This brief hold lets our compliance checks settle before you transact.',
    },
  ];

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity">
          <span className="tracking-tighter text-xl">Baalvion</span>
        </Link>
        <div className="ml-auto flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          <span>Institutional Registration</span>
          <span className="h-1 w-1 rounded-full bg-primary" />
          <span>Application Received</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-10">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-9 w-9 text-green-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Thank you for applying</h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              We&apos;re glad you want to invest with us. Your request for investor access has been received
              and is now under review by our Investor Relations team.
            </p>
            {ref && (
              <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Your reference</span>
                <span className="text-sm font-bold font-mono text-primary">{ref}</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">
              What happens next
            </p>
            <ol className="space-y-6">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/5 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      {i < steps.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border/60" />}
                    </div>
                    <div className="pb-2">
                      <p className="font-semibold leading-tight">{s.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              <Home className="h-4 w-4" /> Return home
            </Link>
            <Link
              href="/resources/contact-ir"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-bold uppercase tracking-widest transition-colors hover:bg-muted"
            >
              Contact IR <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {ref && (
            <p className="mt-6 text-center text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
              Please keep your reference <span className="text-primary">{ref}</span> for any correspondence.
            </p>
          )}
        </div>
      </div>

      <footer className="p-8 text-center text-[10px] text-muted-foreground uppercase tracking-widest border-t bg-card/20">
        <p>SEC Rule 501 Compliance Simulation • All data is encrypted and handled per Baalvion Fiduciary Standards</p>
      </footer>
    </main>
  );
}
