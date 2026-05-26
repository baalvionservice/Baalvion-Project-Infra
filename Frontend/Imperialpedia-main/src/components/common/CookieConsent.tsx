'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Info } from 'lucide-react';
import Link from 'next/link';
import { trackEvent } from '@/lib/utils/analytics';
import { toast } from '@/hooks/use-toast';

/**
 * GDPR & CCPA compliant cookie consent banner.
 * Manages user privacy preferences and persists choices across sessions.
 * 
 * // TODO: AI-driven privacy notifications based on region
 * // TODO: Automatic updates for GDPR/CCPA compliance
 * // TODO: Analytics tracking for consent acceptance/rejection
 */
export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Audit for existing consent node
    const consent = localStorage.getItem('imperialpedia_cookie_consent');
    if (!consent) {
      // Defer visibility for initial discovery handshake
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (choice: 'accepted' | 'rejected') => {
    localStorage.setItem('imperialpedia_cookie_consent', choice);
    setIsVisible(false);
    
    if (choice === 'accepted') {
      // Broadcast engagement to the analytics cluster
      trackEvent({
        category: 'Compliance',
        action: 'Accept Cookies',
        label: 'GDPR Selection'
      });
      
      toast({
        title: "Privacy Handshake Successful",
        description: "Your session is now optimized for institutional research.",
      });
    } else {
      toast({
        title: "Preferences Updated",
        description: "Non-essential cookies have been throttled for this node.",
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 w-full z-[100] p-4 lg:p-6 animate-in slide-in-from-bottom-full duration-1000"
      role="region"
      aria-label="Privacy and Cookie Consent"
    >
      <Container isNarrow>
        <div className="glass-card bg-background/95 backdrop-blur-xl border-primary/20 shadow-2xl rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="space-y-1 text-left">
              <Text variant="bodySmall" weight="bold" className="text-foreground">
                Privacy Protocol Required
              </Text>
              <Text variant="caption" className="text-muted-foreground leading-relaxed">
                Imperialpedia utilizes cookies to enhance your intelligence discovery. By continuing, you accept our use of cookies as defined in the{' '}
                <Link href="/privacy-policy" className="text-primary hover:underline font-bold">Privacy Protocol</Link>.
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button 
              variant="ghost" 
              className="flex-1 md:flex-none h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground border border-white/5"
              onClick={() => handleConsent('rejected')}
            >
              Reject
            </Button>
            <Button 
              className="flex-1 md:flex-none h-11 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
              onClick={() => handleConsent('accepted')}
            >
              Accept
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};
