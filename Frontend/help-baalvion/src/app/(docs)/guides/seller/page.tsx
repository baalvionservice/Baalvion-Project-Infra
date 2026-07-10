import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { EXTERNAL } from '@/lib/site';

const PATH = '/guides/seller';

export const metadata: Metadata = {
  title: 'Seller Guide',
  description: 'Managing listings, orders, and trades as a seller on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Seller Guide"
      description="How to manage listings, fulfill orders, and run trades as a seller on the Baalvion trade platform."
      toc={[
        { id: 'login-flow', text: 'Login Flow' },
        { id: 'dashboard-overview', text: 'Dashboard Overview' },
        { id: 'order-trade-management', text: 'Order & Trade Management' },
        { id: 'listing-management', text: 'Listing Management' },
        { id: 'daily-workflows', text: 'Daily Workflows' },
        { id: 'best-practices', text: 'Best Practices' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
        { id: 'faqs', text: 'FAQs' },
      ]}
    >
      <h2 id="login-flow">Login Flow</h2>
      <p>
        Sign in at <a href={EXTERNAL.login}>{EXTERNAL.login}</a>. Seller accounts route automatically to{' '}
        <code>{'/seller/dashboard'}</code> after authentication. See{' '}
        <Link href="/getting-started/logging-in">Logging In & Role-Based Routing</Link> for details.
      </p>

      <h2 id="dashboard-overview">Dashboard Overview</h2>
      <p>
        The seller dashboard at <a href={EXTERNAL.sellerDashboard}>trade.baalvion.com/seller/dashboard</a> surfaces
        incoming orders, active listings, and fulfillment status at a glance, so you can prioritize what needs
        action first.
      </p>

      <h2 id="order-trade-management">Order & Trade Management</h2>
      <p>
        Each incoming order links back to the buyer and, where relevant, an assigned trade agent. From the order
        detail view you can update fulfillment status, exchange messages, and track the trade through to completion.
      </p>

      <h2 id="listing-management">Listing Management</h2>
      <p>
        Listings represent the products or services you offer to buyers. Keeping listing details, availability, and
        pricing current directly affects how accurately buyers can source from you. Update listings whenever
        availability or terms change rather than letting buyers discover discrepancies at order time.
      </p>

      <h2 id="daily-workflows">Daily Workflows</h2>
      <ul>
        <li><strong>Triage new orders</strong> — review and confirm orders as they arrive.</li>
        <li><strong>Update fulfillment status</strong> — keep buyers informed as a trade progresses.</li>
        <li><strong>Maintain listings</strong> — adjust availability and pricing as conditions change.</li>
        <li><strong>Respond to messages</strong> — reply to buyers and trade agents on active trades.</li>
      </ul>

      <h2 id="best-practices">Best Practices</h2>
      <Callout type="tip" title="Update status before buyers ask">
        Proactively updating an order&rsquo;s fulfillment status reduces inbound messages asking for updates and
        keeps your trade history clean.
      </Callout>
      <ul>
        <li>Review <Link href="/platform/reporting">Reporting</Link> regularly to spot slow-moving orders early.</li>
        <li>Keep listing details accurate rather than relying on messaging to clarify terms after an order is placed.</li>
      </ul>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <Callout type="warning" title="Leaving listings stale">
        Outdated availability or pricing on a listing is one of the most common sources of order disputes. Review
        active listings on a regular cadence, not just when you remember to.
      </Callout>
      <ul>
        <li>Confirming an order without checking that a trade agent hasn&rsquo;t already flagged an issue on it.</li>
        <li>Marking an order fulfilled before logistics or documentation steps are actually complete.</li>
      </ul>

      <h2 id="faqs">FAQs</h2>
      <FaqAccordion
        items={[
          {
            question: 'How do buyers find my listings?',
            answer: 'Buyers browse and search listings from their dashboard. Accurate, complete listing details improve how easily buyers can find and trust your listings.',
          },
          {
            question: 'Can I edit an order after it’s placed?',
            answer: 'You can update fulfillment status and communicate changes through messaging, but core order terms are generally fixed once placed — coordinate changes directly with the buyer or trade agent.',
          },
          {
            question: 'What happens if a trade agent is assigned mid-trade?',
            answer: 'The agent gains visibility into the order and its messaging thread and can help coordinate remaining steps — your workflow otherwise stays the same.',
          },
        ]}
      />
    </DocPage>
  );
}
