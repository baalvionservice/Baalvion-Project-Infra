'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, ShieldCheck, Home, AlertTriangle, Clock, Mail } from 'lucide-react';
import Link from 'next/link';

type Phase = 'submitting' | 'success' | 'error';

export function CompletionStep({ data }: { data: any }) {
  const [phase, setPhase] = useState<Phase>('submitting');
  const [reference, setReference] = useState<string | null>(null);
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
          setReference(json.reference || null);
          setPhase('success');
        } else {
          setError(json.error || 'Submission failed.');
          setPhase('error');
        }
      } catch {
        setError('Network error. Please try again.');
        setPhase('error');
      }
    })();
  }, [data]);

  return (
    <div className="animate-in fade-in duration-500">
      <CardHeader className="text-center border-b border-border/50 pb-8 bg-primary/5">
        <div className="mx-auto mb-4">
          {phase === 'submitting' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
          {phase === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
          {phase === 'error' && <AlertTriangle className="h-12 w-12 text-destructive" />}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {phase === 'submitting' && 'Submitting Your Request…'}
          {phase === 'success' && 'Application Received'}
          {phase === 'error' && 'Submission Issue'}
        </CardTitle>
        <CardDescription>
          {phase === 'submitting' && 'Securely transmitting your details to our investor relations team.'}
          {phase === 'success' && 'Your request for investor access is now under review.'}
          {phase === 'error' && error}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {phase === 'success' && (
          <>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-background/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Applicant</span>
                <span className="text-sm font-bold">{data.fullName}</span>
              </div>
              {reference && (
                <div className="flex justify-between items-center p-4 rounded-xl border border-primary/30 bg-primary/5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reference</span>
                  <span className="text-sm font-bold font-mono text-primary">{reference}</span>
                </div>
              )}
              <div className="flex justify-between items-center p-4 rounded-xl border border-border/50 bg-background/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-500">
                  <Clock className="h-3.5 w-3.5" /> Pending Review
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-background/30 p-5 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> What happens next
              </p>
              <ol className="space-y-2 text-xs text-muted-foreground list-decimal pl-4">
                <li>Our investor relations team reviews your accreditation and details.</li>
                <li>We verify eligibility under applicable private-placement rules.</li>
                <li>On approval, you&apos;ll receive secure portal credentials by email.</li>
              </ol>
              <p className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> Confirmation will be sent to <span className="font-semibold text-foreground">{data.email}</span>
              </p>
            </div>

            {reference && (
              <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter">
                Keep your reference <span className="text-primary">{reference}</span> for any correspondence.
              </p>
            )}

            <Button asChild className="w-full h-12 font-bold uppercase tracking-widest">
              <Link href="/"><Home className="mr-2 h-4 w-4" /> Return to Home</Link>
            </Button>
          </>
        )}

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
