'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, Home, Mail } from 'lucide-react';
import Link from 'next/link';

type Phase = 'submitting' | 'error';

export function CompletionStep({ data }: { data: any }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('submitting');
  const [error, setError] = useState<string>('');
  const submitted = useRef(false);

  useEffect(() => {
    // Guard against double-submit (React strict mode / re-render).
    if (submitted.current) return;
    submitted.current = true;

    (async () => {
      try {
        const res = await fetch('/api/ir/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: data.fullName,
            email: data.email,
            investorType: data.investorType,
            institutionName: data.institutionName,
            accredited: !!data.accredited,
            commitment: data.commitment,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          // Hand off to the dedicated thank-you page; replace() so Back doesn't re-submit.
          const ref = json.reference ? `?ref=${encodeURIComponent(json.reference)}` : '';
          router.replace(`/onboarding/thank-you${ref}`);
        } else {
          setError(json.error || 'Submission failed.');
          setPhase('error');
        }
      } catch {
        setError('Network error. Please try again.');
        setPhase('error');
      }
    })();
  }, [data, router]);

  return (
    <div className="animate-in fade-in duration-500">
      <CardHeader className="text-center border-b border-border/50 pb-8 bg-primary/5">
        <div className="mx-auto mb-4">
          {phase === 'submitting' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
          {phase === 'error' && <AlertTriangle className="h-12 w-12 text-destructive" />}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {phase === 'submitting' && 'Submitting Your Request…'}
          {phase === 'error' && 'Submission Issue'}
        </CardTitle>
        <CardDescription>
          {phase === 'submitting' && 'Securely transmitting your details to our investor relations team.'}
          {phase === 'error' && error}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {phase === 'error' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              We couldn&apos;t submit your application. You can return home and try again, or contact our investor relations team directly.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full font-bold">
                <Link href="/resources/contact-ir"><Mail className="mr-2 h-4 w-4" /> Contact Investor Relations</Link>
              </Button>
              <Button asChild className="w-full font-bold">
                <Link href="/"><Home className="mr-2 h-4 w-4" /> Return to Home</Link>
              </Button>
            </div>
          </div>
        )}

        {phase === 'submitting' && (
          <div className="py-6 text-center text-xs text-muted-foreground uppercase font-bold tracking-widest">
            Please wait…
          </div>
        )}
      </CardContent>
    </div>
  );
}
