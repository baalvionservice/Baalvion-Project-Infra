"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
  link?: { label: string; href: string };
};

interface InvestopediaFaqBoxProps {
  title?: string;
  faqs: FaqItem[];
}

/**
 * Exact Investopedia FAQ component:
 * Blue-bordered container box with expandable questions and direct learn-more links.
 */
export function InvestopediaFaqBox({
  title = "Frequently Asked Questions",
  faqs,
}: InvestopediaFaqBoxProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  if (!faqs || faqs.length === 0) return null;

  const toggle = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section className="rounded-none border-2 border-[#7ba2e7] bg-white p-6 sm:p-10 shadow-sm">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-8">
        {title}
      </h2>

      <div className="divide-y divide-[#bfdbfe]">
        {faqs.map((faq, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div key={idx} className="py-5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 text-left transition-colors hover:text-[#1d4fc4]"
              >
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-[#1d4fc4] flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-3.5 space-y-3 text-sm sm:text-base text-gray-700 leading-relaxed pr-8">
                  <p>{faq.answer}</p>
                  {faq.link && (
                    <div className="text-xs sm:text-sm font-semibold pt-1">
                      <span className="text-gray-500 mr-1.5">Learn More:</span>
                      <Link
                        href={faq.link.href}
                        className="text-[#1d4fc4] hover:underline"
                      >
                        {faq.link.label}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
