'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent } from '@/components/ui/card';
import { X, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { WaitlistModal } from './WaitlistModal';
import { logEvent } from '@/lib/utils/analytics';

/**
 * Scroll-triggered Popup CTA.
 * Appears when the user scrolls 50% down the page.
 * Optimized for high-conversion discovery sessions.
 */
export const ScrollPopupCTA = () => {
  const [show, setShow] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isDismissed) return;
      
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPos = window.scrollY;
      
      // Trigger at 50% scroll depth
      if (scrollPos > scrollHeight / 2) {
        setShow(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleCtaClick = () => {
    logEvent("CTA Click", "Engagement", "Scroll Popup Button");
    setIsModalOpen(true);
  };

  const handleDismiss = () => {
    setShow(false);
    setIsDismissed(true);
    logEvent("CTA Dismiss", "Engagement", "Scroll Popup");
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: '-50%' }}
            className="fixed bottom-12 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
          >
            <Card className="glass-card bg-background/95 backdrop-blur-2xl border-primary/30 shadow-3xl rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Zap className="h-24 w-24 text-primary" />
              </div>
              
              <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-20 rounded-full focus-visible:ring-2 focus-visible:ring-primary outline-none"
                aria-label="Dismiss popup"
              >
                <X className="h-4 w-4" />
              </button>

              <CardContent className="p-8 space-y-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Sparkles className="h-6 w-6" />
                </div>
                
                <div className="space-y-2">
                  <Text variant="h3" className="text-xl font-bold">Discovery in Progress</Text>
                  <Text variant="caption" className="text-muted-foreground leading-relaxed block">
                    You've reached the halfway point of the intelligence index. Secure your spot now for the full platform release.
                  </Text>
                </div>

                <Button 
                  onClick={handleCtaClick}
                  className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all scale-100 active:scale-95 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  Get Early Access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <WaitlistModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};
