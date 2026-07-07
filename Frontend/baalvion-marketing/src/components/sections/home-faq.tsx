import { Reveal } from '@/components/reveal';
import { FaqAccordion, type FaqItem } from '@/components/ui/faq-accordion';

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is Baalvion.com the same as the Trade Portal?',
    answer:
      'No. Baalvion.com is the informational site you’re on now — it explains the platform and points you to the Trade Portal. The actual trade application lives at trade.baalvion.com, where existing users sign in to manage requirements, quotes, and orders.',
  },
  {
    question: 'Who is Baalvion built for?',
    answer:
      'Three roles working the same trade: Buyers who raise requirements and place orders, Sellers who fulfill demand, and Trade Agents who coordinate approvals and keep both sides aligned.',
  },
  {
    question: 'How do I get access to the platform?',
    answer:
      'If your organization already has a Baalvion account, use the Sign In button to reach the Trade Portal login. If you’re new to Baalvion, use the Contact page to reach our sales team about onboarding.',
  },
  {
    question: 'What happens to data once a trade is complete?',
    answer:
      'Completed trades remain in the platform as a permanent, auditable record — including terms, approvals, and fulfillment milestones — so they can support reporting, disputes, and compliance review.',
  },
  {
    question: 'Does Baalvion replace our existing ERP or accounting software?',
    answer:
      'Baalvion is focused on the trade and procurement workflow itself — sourcing, negotiation, approvals, and fulfillment tracking. It is designed to sit alongside financial and ERP systems, not replace them.',
  },
];

export function HomeFaq() {
  return (
    <section className="border-b border-line bg-surface py-24">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="eyebrow">Frequently asked questions</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Answers before you sign in.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            Can&rsquo;t find what you&rsquo;re looking for? Visit the Resources hub or reach out
            through the Contact page.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <FaqAccordion items={FAQ_ITEMS} />
        </Reveal>
      </div>
    </section>
  );
}
