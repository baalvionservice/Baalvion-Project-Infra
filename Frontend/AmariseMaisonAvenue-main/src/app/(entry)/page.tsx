
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/us');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="font-headline text-4xl font-bold animate-pulse">AMARISÉ LUXE</div>
        <p className="text-muted-foreground tracking-widest uppercase text-xs">Initializing Global Luxury Network...</p>
      </div>
    </div>
  );
}
