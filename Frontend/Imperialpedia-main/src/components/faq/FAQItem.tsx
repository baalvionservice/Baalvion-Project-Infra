
'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Text } from "@/design-system/typography/text";
import { cn } from "@/lib/utils";

interface FAQItemProps {
  question: string;
  answer: string;
}

/**
 * Individual FAQ node with smooth accordion transitions.
 * Optimized for institutional-grade information discovery.
 */
export default function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/5 py-4 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 rounded-xl p-2 transition-all group"
        aria-expanded={isOpen}
      >
        <Text variant="h4" className={cn(
          "font-bold text-lg transition-colors group-hover:text-primary",
          isOpen ? "text-primary" : "text-foreground"
        )}>
          {question}
        </Text>
        <div className={cn(
          "p-2 rounded-lg bg-primary/10 text-primary transition-all duration-300",
          isOpen && "bg-primary text-white rotate-180"
        )}>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 px-2">
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
