"use client";

import Link from "next/link";
import { HelpCircle, ArrowRight } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IR_FAQ } from "@/lib/ir-faq";

// Investor FAQ — light section presenting Baalvion's full investor Q&A grouped
// by category. The same IR_FAQ data backs the route's FAQPage JSON-LD, so this
// component is a pure presentation of that source of truth. Interactivity comes
// from the Radix-backed Accordion, hence the client boundary.
export default function InvestorFaqSection({ id }: { id: string }) {
  const slugify = (label: string): string =>
    label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const totalQuestions = IR_FAQ.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <section id={id} className="w-full bg-white text-black">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            Investor FAQ
          </p>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08]">
            Answers for serious investors.
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Considered responses to the questions qualified and accredited
            investors ask most about Baalvion&apos;s business model, market,
            technology and risk profile. {totalQuestions} questions across{" "}
            {IR_FAQ.length} categories.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          {/* Category index — sticky on desktop, hidden on small screens. */}
          <nav
            aria-label="FAQ categories"
            className="hidden lg:block"
          >
            <div className="sticky top-24">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Categories
              </p>
              <ul className="mt-4 space-y-2">
                {IR_FAQ.map((cat) => (
                  <li key={cat.category}>
                    <a
                      href={`#${id}-${slugify(cat.category)}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-black"
                    >
                      <span>{cat.category}</span>
                      <span className="text-xs font-medium text-gray-400">
                        {cat.items.length}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Question groups. */}
          <div className="space-y-12">
            {IR_FAQ.map((cat) => {
              const anchor = `${id}-${slugify(cat.category)}`;
              return (
                <div key={cat.category} id={anchor} className="scroll-mt-24">
                  <div className="flex items-baseline justify-between gap-4 border-b border-gray-200 pb-3">
                    <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-black">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      {cat.category}
                    </h3>
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {cat.items.length}{" "}
                      {cat.items.length === 1 ? "question" : "questions"}
                    </span>
                  </div>

                  <Accordion
                    type="single"
                    collapsible
                    className="mt-2"
                  >
                    {cat.items.map((item, index) => (
                      <AccordionItem
                        key={item.q}
                        value={`${anchor}-${index}`}
                        className="border-gray-200"
                      >
                        <AccordionTrigger className="text-left text-base font-semibold text-black hover:no-underline [&[data-state=open]]:text-primary">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="max-w-2xl text-[0.95rem] leading-relaxed text-gray-600">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}

            {/* Closing CTA. */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
              <h3 className="text-lg font-bold tracking-tight text-black">
                Have a question we haven&apos;t answered?
              </h3>
              <p className="mt-2 max-w-xl text-sm text-gray-600">
                Our investor relations team responds to substantive diligence
                questions from qualified and accredited investors directly.
              </p>
              <Link
                href="/resources/contact-ir"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                Contact investor relations
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
