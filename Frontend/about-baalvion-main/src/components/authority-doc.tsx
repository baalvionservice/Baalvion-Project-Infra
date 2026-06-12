import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { RichDoc } from '@/lib/cms';
import { RichContent } from '@/components/rich-content';
import { PageFaq } from '@/components/page-faq';
import type { Crumb } from '@/lib/schema';

interface RelatedLink {
  label: string;
  href: string;
}

interface AuthorityDocProps {
  doc: RichDoc;
  eyebrow: string;
  crumbs: Crumb[];
  related?: { title: string; links: RelatedLink[] };
  ctaTitle?: string;
  ctaText?: string;
}

/**
 * Shared detail renderer for the authority surfaces (services, industries,
 * case studies, about). Renders a visible breadcrumb, hero, rich body, optional
 * "key facts" panel (case-study results / service tech stack), FAQ, related
 * links, and a CTA. Schema/metadata are owned by the route, not this component.
 */
export function AuthorityDoc({ doc, eyebrow, crumbs, related, ctaTitle, ctaText }: AuthorityDocProps) {
  const cf = doc.custom || {};
  const results: { metric: string; value: string }[] = Array.isArray(cf.results) ? cf.results : [];
  const techStack: string[] = Array.isArray(cf.techStack) ? cf.techStack : [];
  const benefits: string[] = Array.isArray(cf.benefits) ? cf.benefits : [];

  return (
    <main className="pt-32 pb-0">
      <div className="max-w-4xl mx-auto px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1 text-xs font-bold uppercase tracking-widest text-gray-400">
            {crumbs.map((c, i) => (
              <li key={c.url} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                {i < crumbs.length - 1 ? (
                  <Link href={c.url} className="hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                ) : (
                  <span className="text-gray-700">{c.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 block">
            {eyebrow}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-[#111111] leading-tight tracking-tight">
            {doc.title}
          </h1>
          {doc.excerpt && <p className="mt-5 text-xl text-gray-500 font-medium leading-relaxed">{doc.excerpt}</p>}
        </header>

        {/* Key facts panel (case study / service) */}
        {(results.length > 0 || techStack.length > 0) && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-[#F7F9FA] p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Results</h2>
                <dl className="grid grid-cols-2 gap-4">
                  {results.map((r, i) => (
                    <div key={i}>
                      <dd className="text-2xl font-bold text-[#111111]">{r.value}</dd>
                      <dt className="text-xs text-gray-500 mt-1">{r.metric}</dt>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {techStack.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-[#F7F9FA] p-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Technology Stack</h2>
                <ul className="flex flex-wrap gap-2">
                  {techStack.map((t, i) => (
                    <li key={i} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <article className="mb-16">
          <RichContent blocks={doc.blocks} />
        </article>

        {/* Benefits highlight (service) */}
        {benefits.length > 0 && (
          <div className="mb-16 rounded-2xl bg-black p-8 md:p-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-6">Why it matters</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-200">
                  <ArrowRight className="w-4 h-4 text-primary mt-1 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FAQ */}
        <PageFaq faqs={doc.faqs} />

        {/* Related */}
        {related && related.links.length > 0 && (
          <section className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">{related.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-center justify-between rounded-lg border border-gray-100 px-5 py-4 hover:border-primary/40 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-800 group-hover:text-[#007185]">{l.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CTA */}
      <section className="mt-24 bg-[#151B24] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            {ctaTitle || 'Build with Baalvion'}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            {ctaText || 'Talk to our strategy team about how the Baalvion Operating System can power your next platform.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="rounded-full bg-primary px-8 py-3 font-bold text-white hover:bg-[#e68a00] transition-colors">
              Contact Us
            </Link>
            <Link href="/services" className="rounded-full border border-gray-600 px-8 py-3 font-bold text-gray-200 hover:border-primary hover:text-white transition-colors">
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
