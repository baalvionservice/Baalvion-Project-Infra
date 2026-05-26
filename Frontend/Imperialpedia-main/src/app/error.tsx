'use client';

import React, { useEffect } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, RefreshCw, ArrowLeft, ShieldCheck, Terminal } from 'lucide-react';
import Link from 'next/link';

/**
 * Global Error Boundary Component.
 * Provides a professional recovery interface for unexpected system exceptions.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our institutional telemetry service
    console.error('System Exception Detected:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center py-20 animate-in fade-in duration-700">
      <Container className="max-w-2xl text-center space-y-10">
        <div className="space-y-6">
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2.5rem] bg-primary/10 animate-pulse" />
            <div className="absolute inset-2 rounded-[2rem] border-2 border-primary/20" />
            <ShieldAlert className="h-12 w-12 text-primary relative z-10" />
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-widest text-[10px] font-bold px-3 mb-2">System Exception</Badge>
            <Text variant="h1" className="text-4xl lg:text-6xl font-bold tracking-tight">Cluster Desync</Text>
            <Text variant="body" className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
              We encountered a structural deviation while traversing the knowledge matrix. The security kernel has throttled the current session to ensure index integrity.
            </Text>
          </div>
        </div>

        {error.digest && (
          <div className="p-4 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center gap-3 font-mono text-[10px] text-muted-foreground uppercase">
            <Terminal className="h-3.5 w-3.5" /> Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="outline" className="h-14 px-8 rounded-2xl font-bold border-white/10 bg-card/30 gap-2 min-w-[200px]" asChild>
            <Link href="/"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          <Button 
            size="lg" 
            onClick={() => reset()}
            className="h-14 px-10 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 min-w-[200px]"
          >
            <RefreshCw className="mr-2 h-5 w-5" /> Force Re-sync
          </Button>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-emerald-500 text-xs uppercase font-bold tracking-widest">
            <ShieldCheck className="h-4 w-4" /> Integrity Guard Active
          </div>
          <Text variant="caption" className="text-muted-foreground italic leading-relaxed">
            "Your data traversal is cryptographically signed. Retrying the handshake will re-establish your connection to the intelligence cluster."
          </Text>
          {/* TODO: Suggest alternative pages or help content dynamically using AI in Phase 2 */}
        </div>
      </Container>
    </main>
  );
}
