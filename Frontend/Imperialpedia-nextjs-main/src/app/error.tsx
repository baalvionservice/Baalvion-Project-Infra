'use client';

import React, { useEffect } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Global error boundary. Renders whenever a page throws an unhandled
 * exception (e.g. an unreachable backend). Kept honest and plain — no
 * invented status/diagnostics copy, since this is exactly the moment a
 * reader is most likely to distrust the site if the message reads as fake.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled page error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-20 animate-in fade-in duration-700">
      <Container className="max-w-2xl text-center space-y-10">
        <div className="space-y-6">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2rem] bg-muted/50" />
            <AlertTriangle className="h-10 w-10 text-muted-foreground relative z-10" />
          </div>

          <div className="space-y-2">
            <Text variant="h1" as="h1" className="text-3xl lg:text-4xl font-bold tracking-tight">Something went wrong</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
              This page hit an unexpected error. It&apos;s likely temporary — try again, or head back to the homepage.
            </Text>
          </div>
        </div>

        {error.digest && (
          <Text variant="caption" className="text-muted-foreground font-mono">
            Error reference: {error.digest}
          </Text>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="outline" className="h-12 px-8 rounded-xl font-bold border-white/10 bg-card/30 gap-2 min-w-[180px]" asChild>
            <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to Homepage</Link>
          </Button>
          <Button
            onClick={() => reset()}
            className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 min-w-[180px]"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      </Container>
    </main>
  );
}
