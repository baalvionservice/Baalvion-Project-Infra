import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/reveal';
import { CtaBand } from '@/components/ui/cta-band';

export const metadata: Metadata = {
  title: 'Resources',
  description:
    'Guides, FAQs, and best practices for getting the most out of Baalvion — for buyers, sellers, and trade agents.',
};

type ResourceCard = {
  title: string;
  body: string;
  tag: string;
};

const GETTING_STARTED: ResourceCard[] = [
  {
    title: 'Getting Started with Baalvion',
    body: 'A first-time walkthrough of the platform: creating your account, understanding roles, and completing your first trade.',
    tag: 'Guide',
  },
];

const ROLE_GUIDES: ResourceCard[] = [
  {
    title: 'Buyer Guide',
    body: 'How to post requirements, evaluate quotes, and manage orders from approval through delivery.',
    tag: 'Guide',
  },
  {
    title: 'Seller Guide',
    body: 'How to respond to live requirements, submit competitive quotes, and manage fulfillment end to end.',
    tag: 'Guide',
  },
  {
    title: 'Trade Agent Guide',
    body: 'How to coordinate approvals, manage your task queue, and keep trades moving without delay.',
    tag: 'Guide',
  },
  {
    title: 'Best Practices',
    body: 'Field-tested recommendations for structuring requirements, negotiating terms, and avoiding common fulfillment delays.',
    tag: 'Playbook',
  },
];

const SUPPORT: ResourceCard[] = [
  {
    title: 'Frequently Asked Questions',
    body: 'Answers to the questions we hear most from buyers, sellers, and trade agents evaluating or using Baalvion.',
    tag: 'FAQ',
  },
];

const UPDATES: ResourceCard[] = [
  {
    title: 'Product Updates',
    body: 'Placeholder — a running log of new capabilities, workflow improvements, and platform changes will appear here.',
    tag: 'Placeholder',
  },
  {
    title: 'Release Notes',
    body: 'Placeholder — detailed, versioned release notes for every platform update will be published here.',
    tag: 'Placeholder',
  },
];

function ResourceGroup({
  id,
  eyebrow,
  title,
  cards,
}: {
  id: string;
  eyebrow: string;
  title: string;
  cards: ResourceCard[];
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-line py-20">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <Reveal key={card.title} delay={index * 60}>
              {/* Links to a dedicated Help Center are pending; cards render as previews until that surface ships. */}
              <a href="#" className="focus-ring card block h-full">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-2">
                  {card.tag}
                </span>
                <h3 className="mt-3 text-base font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ResourcesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero
          eyebrow="Resources"
          title="Everything you need to get the most out of Baalvion."
          description="Guides, best practices, and answers for every role on the platform — with more added as the Help Center grows."
        />

        <ResourceGroup id="getting-started" eyebrow="Start here" title="Getting started" cards={GETTING_STARTED} />
        <ResourceGroup id="guides" eyebrow="Role guides" title="Guides for every role" cards={ROLE_GUIDES} />
        <ResourceGroup id="faqs" eyebrow="Support" title="Frequently asked questions" cards={SUPPORT} />
        <ResourceGroup id="updates" eyebrow="What's new" title="Product updates & release notes" cards={UPDATES} />

        <CtaBand
          title="Can't find what you're looking for?"
          description="Our team is happy to help directly — reach out and we'll point you in the right direction."
          secondaryLabel="Contact Us"
          secondaryHref="/contact"
        />
      </main>
      <SiteFooter />
    </>
  );
}
