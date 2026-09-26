import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReviewArticle } from "@/types/Review";

// JSON-LD is injected server-side via a plain <script> tag
// (avoids the 'use client' restriction on the JsonLd component)
function FAQSchema({ faqs }: { faqs: ReviewArticle["faqs"] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ReviewFAQ({ review }: { review: ReviewArticle }) {
  return (
    <section className="my-12">
      <FAQSchema faqs={review.faqs} />

      <h2 className="text-2xl font-bold text-foreground mb-6">
        Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible className="w-full space-y-2">
        {review.faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border rounded-xl px-5 data-[state=open]:border-primary/40 transition-colors"
          >
            <AccordionTrigger className="text-left text-base font-semibold text-foreground py-4 hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-[1.0625rem] leading-[1.85] text-foreground pb-4">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}