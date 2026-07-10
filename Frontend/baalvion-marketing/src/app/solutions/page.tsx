import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/reveal';
import { CtaBand } from '@/components/ui/cta-band';
import { SOLUTIONS_CONTENT } from '@/lib/solutions-content';
import type { Role } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Solutions',
  description:
    'Baalvion serves three roles in every trade — Buyers, Sellers, and Trade Agents — each with a dedicated workflow built around the same shared order record.',
};

const ROLE_ORDER: Role[] = ['buyers', 'sellers', 'trade-agents'];

export default function SolutionsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero
          eyebrow="Solutions"
          title="Built for the roles that make trade happen."
          description="Every trade on Baalvion involves three roles working from the same record. Explore how each one experiences the platform."
        />

        <section className="py-24">
          <div className="container-site grid gap-6 lg:grid-cols-3">
            {ROLE_ORDER.map((role, index) => {
              const content = SOLUTIONS_CONTENT[role];
              return (
                <Reveal key={role} delay={index * 80}>
                  <div className="card flex h-full flex-col">
                    <p className="eyebrow">{content.heroEyebrow}</p>
                    <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                      {content.heroTitle}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                      {content.heroDescription}
                    </p>
                    <ul className="mt-6 space-y-2 border-t border-line pt-5">
                      {content.responsibilities.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm text-muted">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-iris-cyan" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/solutions/${role}`}
                      className="focus-ring mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground"
                    >
                      View {content.heroEyebrow.replace('Solutions for ', '')} solutions
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <CtaBand
          title="Not sure which role fits your team?"
          description="Reach out and we'll help map your organization's workflow onto the right combination of roles on Baalvion."
          secondaryLabel="Contact Us"
          secondaryHref="/contact"
        />
      </main>
      <SiteFooter />
    </>
  );
}
