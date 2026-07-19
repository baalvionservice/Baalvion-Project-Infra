import React from 'react';
import Link from 'next/link';
import { Construction } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/design-system/layout/container';

interface FeatureUnavailableProps {
  /** What the feature is called, e.g. "Editorial Queue". */
  title: string;
  /**
   * Why it isn't shown. Keep this honest — this component exists specifically so the
   * app never renders fabricated placeholder data as if it were real.
   */
  reason?: string;
  backHref?: string;
  backLabel?: string;
}

/**
 * Honest "not available" state for any surface whose data would otherwise come from
 * the deprecated `@/services/mock-api/*` layer. Rendering this instead of fabricated
 * numbers/queues/reports is a deliberate product decision, not a bug — see the
 * mock-data remediation report for the full rationale.
 */
export function FeatureUnavailable({
  title,
  reason = 'This feature is not connected to a live data source yet, so it is hidden rather than showing placeholder content.',
  backHref = '/',
  backLabel = 'Back to Imperialpedia',
}: FeatureUnavailableProps) {
  return (
    <Container className="max-w-2xl py-20">
      <Card className="glass-card border-white/10 text-center">
        <CardHeader className="items-center pb-2">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
            <Construction className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">{title} isn&apos;t available yet</CardTitle>
          <CardDescription className="mt-2 text-sm leading-relaxed">{reason}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default FeatureUnavailable;
