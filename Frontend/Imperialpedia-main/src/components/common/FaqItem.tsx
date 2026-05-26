'use client';

import React, { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ChevronUp, ChevronDown } from "lucide-react";
import { Text } from "@/design-system/typography/text";
import { cn } from "@/lib/utils";
import { trackEvent, logEvent } from '@/lib/utils/analytics';

interface FaqItemProps {
  question: string;
  answer: string;
}

/**
 * Individual FAQ node with smooth accordion transitions.
 * Optimized for institutional-grade information discovery.
 * Enhanced with ARIA attributes for accessibility and analytics tracking.
 */
export default function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();
  const buttonId = useId();

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    
    // Broadcast interaction to the analytics cluster
    if (nextState) {
      logEvent("faq_open", "Interaction", question);
      
      trackEvent({
        category: 'FAQ',
        action: 'faq_open',
        label: question
      });
    }
  };

  return (
    <div className="border-b border-white/5 py-4 last:border-0">
      <button
        id={buttonId}
        onClick={handleToggle}
        className="w-full text-left flex justify-between items-center py-4 px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-xl transition-all group outline-none"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <Text variant="h4" className="font-semibold text-md group-hover:text-primary transition-colors pr-8">
          {question}
        </Text>
        <div className={cn(
          "p-2 rounded-lg bg-primary/10 text-primary transition-all duration-300 shrink-0",
          isOpen && "bg-primary text-white rotate-180"
        )}>
          {isOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 px-2 mt-2">
              <Text variant="bodySmall" className="text-muted-foreground leading-relaxed text-base">
                {answer}
              </Text>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
