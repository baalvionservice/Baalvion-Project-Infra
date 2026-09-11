"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
  link?: { label: string; href: string };
};

interface ImperialpediaFaqBoxProps {
  title?: string;
  faqs: FaqItem[];
}

/**
 * Imperialpedia Style Category FAQ Component:
 * Heavy Imperialpedia black-bordered card box with crimson red header tag
 * and expandable questions.
 */
export function ImperialpediaFaqBox({
  title = "Frequently Asked Questions",
  faqs,
}: ImperialpediaFaqBoxProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  if (!faqs || faqs.length === 0) return null;

  const toggle = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(200,16,46,0.3)] my-12 relative rounded-xs">
      <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />
      
      <div className="flex items-center gap-2 mb-6 pt-1 border-b-3 border-black dark:border-slate-800 pb-4">
        <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-6">
          IMPERIALPEDIA FAQ
        </span>
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black dark:text-white font-serif">
          {title}
        </h2>
      </div>

      <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
        {faqs.map((faq, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div key={idx} className="py-5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 text-left transition-colors hover:text-[#c8102e] group cursor-pointer"
              >
                <span className="text-base sm:text-lg font-black text-black dark:text-white uppercase font-serif group-hover:text-[#c8102e]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-[#c8102e] shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-3.5 space-y-3 text-sm sm:text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed pr-8 border-l-4 border-[#c8102e] pl-4 bg-slate-50 dark:bg-slate-800/60 py-3 rounded-r-xs">
                  <p>{faq.answer}</p>
                  {faq.link && (
                    <div className="text-xs sm:text-sm font-black pt-1 uppercase font-mono">
                      <span className="text-slate-500 mr-1.5">LEARN MORE:</span>
                      <Link
                        href={faq.link.href}
                        className="text-[#c8102e] hover:underline"
                      >
                        {faq.link.label} →
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
