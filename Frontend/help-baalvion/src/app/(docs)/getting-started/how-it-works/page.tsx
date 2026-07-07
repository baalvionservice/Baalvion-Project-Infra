import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Steps, Step } from '@/components/ui/steps';
import { Callout } from '@/components/ui/callout';

const PATH = '/getting-started/how-it-works';

export const metadata: Metadata = {
  title: 'How the Platform Works',
  description: 'The trade lifecycle, roles, and how buyers, sellers, and agents interact on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="How the Platform Works"
      description="A high-level walkthrough of how a trade moves through Baalvion, from first contact to completion."
      toc={[
        { id: 'the-trade-lifecycle', text: 'The Trade Lifecycle' },
        { id: 'how-roles-interact', text: 'How Roles Interact' },
        { id: 'dashboards', text: 'Dashboards' },
        { id: 'faqs', text: 'FAQs' },
      ]}
    >
      <h2 id="the-trade-lifecycle">The Trade Lifecycle</h2>
      <p>
        A trade on Baalvion generally moves through the same set of stages, regardless of the product or industry
        involved:
      </p>
      <Steps>
        <Step title="Sourcing">
          A buyer browses or requests listings from sellers and identifies a potential trade.
        </Step>
        <Step title="Negotiation & agreement">
          Buyer and seller agree on terms. A trade agent may be assigned to coordinate the process.
        </Step>
        <Step title="Order creation">
          The trade is formalized as an order, visible on both the buyer&rsquo;s and seller&rsquo;s dashboards.
        </Step>
        <Step title="Fulfillment">
          The seller fulfills the order. The trade agent, if assigned, tracks tasks and approvals along the way.
        </Step>
        <Step title="Completion">
          The order is marked complete and becomes part of both parties&rsquo; trade history and reporting.
        </Step>
      </Steps>

      <h2 id="how-roles-interact">How Roles Interact</h2>
      <p>
        Buyers and sellers interact directly through orders and messaging. Trade agents sit alongside a trade to
        manage operational details — approvals, documentation, logistics tasks — without owning the commercial
        relationship itself. See the <Link href="/guides/buyer">Buyer Guide</Link>,{' '}
        <Link href="/guides/seller">Seller Guide</Link>, and <Link href="/guides/agent">Trade Agent Guide</Link> for
        role-specific workflows.
      </p>

      <Callout type="tip" title="Not every trade needs an agent">
        Trade agents are typically assigned to more complex or higher-value trades. Simpler trades can move directly
        between a buyer and seller.
      </Callout>

      <h2 id="dashboards">Dashboards</h2>
      <p>
        Every role has a dedicated dashboard that surfaces the information and actions relevant to that role. See{' '}
        <Link href="/platform/dashboard-system">Dashboard System</Link> for how dashboards are structured across the
        platform.
      </p>

      <h2 id="faqs">FAQs</h2>
      <p>
        <strong>Can I be a buyer and a seller at the same time?</strong> Each account has one role. An organization
        can hold separate buyer and seller accounts if it operates on both sides of trades.
      </p>
      <p>
        <strong>Do all trades require a trade agent?</strong> No — a trade agent is assigned only when a trade
        needs additional coordination.
      </p>
    </DocPage>
  );
}
