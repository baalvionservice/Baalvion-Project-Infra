'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import trialData from '@/lib/data/trial-status.json';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TrialBanner() {
  const [progress, setProgress] = useState(0);

  if (!trialData.onTrial) {
    return null;
  }

  const progressValue = ((trialData.totalDays - trialData.daysRemaining) / trialData.totalDays) * 100;
  
  useEffect(() => {
    const timer = setTimeout(() => setProgress(progressValue), 500);
    return () => clearTimeout(timer);
  }, [progressValue]);


  return (
    <Alert className="flex w-full items-center justify-center gap-4 rounded-none border-x-0 border-t-0 border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300 [&>svg]:text-orange-800 dark:[&>svg]:text-orange-300">
      <Target className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle className="font-bold">You're on a 14-day free trial.</AlertTitle>
        <div className="flex flex-col items-start gap-2">
            <Progress value={progress} className="w-32 h-1.5 [&>div]:bg-orange-500" />
            <AlertDescription className="text-xs">
                 {trialData.daysRemaining} days remaining.
            </AlertDescription>
        </div>
      </div>
       <Link href="/settings/billing">
            <Button size="sm" className="bg-orange-600 text-white hover:bg-orange-700">Upgrade Now</Button>
       </Link>
    </Alert>
  );
}
