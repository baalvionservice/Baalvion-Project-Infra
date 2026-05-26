'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { WaitlistModal } from './WaitlistModal';
import { useToast } from '@/components/common/ToastManager';
import { cn } from '@/lib/utils';
import { logEvent } from '@/lib/utils/analytics';

/**
 * Sticky CTA Banner for high-conversion user acquisition.
 * Refined with optimized scroll thresholds and institutional styling.
 */
export const StickyCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const dismissedStatus = localStorage.getItem('imperialpedia_cta_dismissed');
    if (!dismissedStatus) {
      setIsDismissed(false);
      
      const handleScroll = () => {
        // Show after 300px scroll threshold
        if (window.scrollY > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('imperialpedia_cta_dismissed', 'true');
    logEvent("CTA Dismiss", "Engagement", "Sticky Banner");
    setTimeout(() => setIsDismissed(true), 500);
  };

  const handleSignUpClick = () => {
    setIsModalOpen(true);
    logEvent("CTA Click", "Engagement", "Sticky Banner Button");
    
    addToast({
      message: "Establishing Handshake: Opening secure waitlist portal...",
      type: "info",
    });
  };

  if (isDismissed) return null;

  return (
    <>
      <div 
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl transition-all duration-700 ease-out transform",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
        )}
      >
        <div className="glass-card bg-primary/10 border-primary/30 shadow-2xl shadow-primary/20 rounded-[2rem] p-4 pr-12 relative group pointer-events-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-2">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/20 text-primary shadow-inner">
                <Sparkles className="h-5 w-5 animate-pulse" aria-hidden="true" />
              </div>
              <div className="space-y-0.5">
                <Text variant="bodySmall" weight="bold" className="text-foreground">
                  Join the Imperialpedia Waitlist Today
                </Text>
                <Text variant="caption" className="text-muted-foreground hidden sm:block">
                  Secure early access to 1M+ structured intelligence nodes.
                </Text>
              </div>
            </div>

            <Button 
              onClick={handleSignUpClick}
              className="h-11 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all scale-105 active:scale-95 group/btn focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              Secure My Spot <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>

          <button 
            onClick={handleDismiss}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full focus-visible:ring-2 focus-visible:ring-primary outline-none"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <WaitlistModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};
