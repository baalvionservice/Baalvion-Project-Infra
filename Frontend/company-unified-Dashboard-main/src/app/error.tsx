
'use client'; 

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
         <Image 
            src="https://picsum.photos/seed/500-error/400/300"
            width={400}
            height={300}
            alt="System breakdown illustration"
            className="mx-auto mb-8 rounded-lg"
            data-ai-hint="system error"
        />
        <h1 className="text-3xl font-bold tracking-tight">Something went wrong!</h1>
        <p className="mt-4 text-muted-foreground">
          We're sorry, but an unexpected error occurred on our end. Our team has been notified.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            onClick={
              () => reset()
            }
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
