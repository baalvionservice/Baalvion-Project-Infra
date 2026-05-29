'use client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useDocs } from '@/hooks/use-docs';

export default function FaqSection() {
  const { faq: faqData } = useDocs();
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="mt-2 text-lg text-muted-foreground">Got questions? We've got answers.</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index + 1}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
