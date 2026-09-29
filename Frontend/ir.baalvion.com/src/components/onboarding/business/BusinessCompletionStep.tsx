'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, Home, Mail, Clock } from 'lucide-react';
import Link from 'next/link';
import type { BusinessOnboardingData } from './options';
import type { SubmissionResult } from './BusinessOnboardingFunnel';

interface Props {
  data: BusinessOnboardingData;
  result: SubmissionResult;
}

export function BusinessCompletionStep({ data, result }: Props) {
  return (
    <div className="animate-in fade-in duration-500" suppressHydrationWarning>
      <CardHeader className="text-center border-b border-border/50 pb-8 bg-primary/5">
        <div className="mx-auto mb-4">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Application Submitted</CardTitle>
        <CardDescription>
          {data.legalName ? `${data.legalName} has been registered for onboarding.` : 'Your business onboarding application has been received.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="rounded-lg border border-border/50 bg-background/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Reference</span>
            <span className="font-mono text-lg font-bold tracking-tight">{result.reference || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Status</span>
            <Badge variant="secondary" className="uppercase">{result.status || 'submitted'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">KYC</span>
            <Badge variant="outline" className="uppercase">{result.kycStatus || 'pending'}</Badge>
          </div>
          {typeof result.documentsCount === 'number' && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">Documents</span>
              <span className="text-sm font-bold">{result.documentsCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Clock className="h-5 w-5 shrink-0 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold">What happens next</p>
            <p className="text-xs text-muted-foreground">
              Our compliance team will verify your KYC details and trade/tax registrations. You&apos;ll be notified at
              {data.contactEmail ? ` ${data.contactEmail}` : ' your contact email'} once the review is complete. Keep your
              reference number for any correspondence.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full font-bold">
            <Link href="/resources/contact-ir"><Mail className="mr-2 h-4 w-4" /> Contact the Onboarding Team</Link>
          </Button>
          <Button asChild className="w-full font-bold">
            <Link href="/"><Home className="mr-2 h-4 w-4" /> Return to Home</Link>
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
