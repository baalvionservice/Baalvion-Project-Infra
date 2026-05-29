'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useBilling } from '@/hooks/use-billing';
import Link from 'next/link';

export default function RateLimitBanner() {
    const billingData = useBilling();
    const { used, limit } = billingData.usage.apiCalls;
    const usage = limit ? (used / limit) * 100 : 0;

    if (usage < 80) {
        return null;
    }

    return (
         <Alert className="flex w-full items-center justify-center gap-4 rounded-none border-x-0 border-t-0 border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 [&>svg]:text-yellow-800 dark:[&>svg]:text-yellow-300">
            <AlertCircle className="h-5 w-5" />
            <div className="flex-1">
                <AlertTitle className="font-bold">API Rate Limit Approaching</AlertTitle>
                <AlertDescription className="text-xs">
                    You've used {usage.toFixed(0)}% of your monthly API calls.
                </AlertDescription>
            </div>
            <Link href="/settings/billing">
                <Button size="sm" className="bg-yellow-500 text-white hover:bg-yellow-600">Upgrade for more capacity</Button>
            </Link>
        </Alert>
    );
}
