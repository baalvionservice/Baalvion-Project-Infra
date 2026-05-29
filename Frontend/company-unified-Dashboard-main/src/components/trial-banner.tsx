'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import { useBilling } from '@/hooks/use-billing';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TrialBanner() {
  const billingData = useBilling();
  // Live: only show the trial banner when the subscription is actually trialing.
  const onTrial = String(billingData.subscription?.status ?? '').toLowerCase() === 'trialing';
  const totalDays = 14;
  const daysRemaining = totalDays; // backend has no per-day trial counter yet; show the full window.
  const progressValue = totalDays ? ((totalDays - daysRemaining) / totalDays) * 100 : 0;

  // Hooks must run unconditionally (the early return lives below them).
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!onTrial) return;
    const timer = setTimeout(() => setProgress(progressValue), 500);
    return () => clearTimeout(timer);
  }, [progressValue, onTrial]);

  if (!onTrial) {
    return null;
  }

  return (
    <Alert className="flex w-full items-center justify-center gap-4 rounded-none border-x-0 border-t-0 border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300 [&>svg]:text-orange-800 dark:[&>svg]:text-orange-300">
      <Target className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle className="font-bold">You're on a 14-day free trial.</AlertTitle>
        <div className="flex flex-col items-start gap-2">
            <Progress value={progress} className="w-32 h-1.5 [&>div]:bg-orange-500" />
            <AlertDescription className="text-xs">
                 {daysRemaining} days remaining.
            </AlertDescription>
        </div>
      </div>
       <Link href="/settings/billing">
            <Button size="sm" className="bg-orange-600 text-white hover:bg-orange-700">Upgrade Now</Button>
       </Link>
    </Alert>
  );
}
