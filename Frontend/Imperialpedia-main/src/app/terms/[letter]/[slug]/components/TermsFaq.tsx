"use client";

import React, { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ChevronUp, ChevronDown } from "lucide-react";
import { Text } from "@/design-system/typography/text";
import { cn } from "@/lib/utils";
import { trackEvent, logEvent } from "@/lib/utils/analytics";
import { accordionType } from "@/lib/data/terms";

/**
 * Individual FAQ node with smooth accordion transitions.
 * Optimized for institutional-grade information discovery.
 * Enhanced with ARIA attributes for accessibility and analytics tracking.
 */
export default function TermsFaqItem({ question, answer }: accordionType) {
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
        category: "FAQ",
        action: "faq_open",
        label: question,
      });
    }
  };

  return (
    <div className="border-b border-foreground/60 py-2 last:border-0 ">
      <button
        id={buttonId}
        onClick={handleToggle}
        className="w-full text-left flex justify-between items-center py-4  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background rounded-xl transition-all group outline-none"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <Text
          variant="body"
          className="font-semibold text-black dark:text-white text-lg hover:text-primary transition-colors pr-8"
        >
          {question}
        </Text>
        <div
          className={cn(
            " text-primary transition-all duration-300 shrink-0",
            isOpen && " text-primary rotate-180"
          )}
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
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
            <div className="pb-6 px-2">
              <Text
                variant="bodySmall"
                className="text-black dark:text-white   space-y-3 text-lg font-medium"
              >
                <ol className="list-decimal list-inside space-y-2">
                  {answer.map((ans, i) => (
                    <li key={i}>
                      <a className="hover:text-primary" href={ans.link}>
                        {ans.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </Text>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
