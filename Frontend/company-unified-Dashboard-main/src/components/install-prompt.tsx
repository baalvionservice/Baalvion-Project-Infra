'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Download } from 'lucide-react';
import Image from 'next/image';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 30 seconds
      setTimeout(() => {
          const installed = localStorage.getItem('app_installed');
          if (!installed) {
              setShowPrompt(true);
          }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          localStorage.setItem('app_installed', 'true');
        }
        setShowPrompt(false);
        setDeferredPrompt(null);
      });
    }
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <Sheet open={showPrompt} onOpenChange={setShowPrompt}>
      <SheetContent side="bottom" className="w-full rounded-t-lg">
        <SheetHeader className="text-center">
            <div className="flex justify-center mb-4">
                 <Image src="/icons/icon-192x192.png" alt="Baalvion Logo" width={80} height={80} className="rounded-xl" data-ai-hint="logo" />
            </div>
            <SheetTitle>Install Baalvion</SheetTitle>
            <SheetDescription>
                Add Baalvion to your home screen for faster access and an app-like experience.
            </SheetDescription>
        </SheetHeader>
        <div className="py-4 px-4 flex flex-col gap-2">
          <Button onClick={handleInstallClick} size="lg">
              <Download className="mr-2 h-4 w-4"/> Install App
          </Button>
           <Button variant="ghost" onClick={() => setShowPrompt(false)}>
              Not now
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
