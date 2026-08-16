"use client";

import { useState } from "react";
import FAQItem from "@/components/faq/FAQItem";

interface FAQAccordionSectionProps {
  faqs: { question: string; answer: string }[];
  /** How many questions to show before collapsing the rest behind "Show more". */
  initialVisible?: number;
  title?: string;
}

/**
 * Caps long, CMS-aggregated FAQ lists to a scannable preview instead of
 * dumping every question on the page at once, with a "Show more" toggle
 * to reveal the rest in place.
 */
export default function FAQAccordionSection({
  faqs,
  initialVisible = 8,
  title = "Frequently Asked Questions",
}: FAQAccordionSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (faqs.length === 0) return null;

  const visible = expanded ? faqs : faqs.slice(0, initialVisible);
  const remaining = faqs.length - visible.length;

  return (
    <section>
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2">
        {title}
      </h3>
      <div className="rounded-2xl border border-gray-100 px-4">
        {visible.map((f) => (
          <FAQItem key={f.question} question={f.question} answer={f.answer} />
        ))}
      </div>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-foreground transition-colors hover:border-gray-900 hover:bg-gray-50"
        >
          Show {remaining} more question{remaining === 1 ? "" : "s"}
        </button>
      )}
    </section>
  );
}
