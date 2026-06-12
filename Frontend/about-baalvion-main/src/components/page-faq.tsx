import type { FaqItem } from '@/lib/cms';

/**
 * Server-rendered FAQ block using native <details>/<summary> so the content is
 * in the initial HTML (good for crawling) and interactive without client JS.
 * Pair with faqSchema() + <JsonLd> for FAQPage structured data.
 */
export function PageFaq({ faqs, heading = 'Frequently Asked Questions' }: { faqs: FaqItem[]; heading?: string }) {
  if (!faqs || faqs.length === 0) return null;
  return (
    <section className="mt-20 pt-12 border-t border-gray-100" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl md:text-3xl font-bold text-[#111111] tracking-tight mb-8">
        {heading}
      </h2>
      <div className="divide-y divide-gray-100 border-y border-gray-100">
        {faqs.map((f, i) => (
          <details key={i} className="group py-5">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-semibold text-gray-900 list-none">
              <span>{f.q}</span>
              <span className="text-primary text-2xl leading-none transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-base text-gray-600 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
