import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { EXTERNAL } from '@/lib/site';

const PATH = '/guides/buyer';

export const metadata: Metadata = {
  title: 'Buyer Guide',
  description: 'Dashboard walkthrough, daily workflows, and best practices for buyers on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Buyer Guide"
      description="Everything a buyer needs to source, order, and track trades on the Baalvion trade platform."
      toc={[
        { id: 'login-flow', text: 'Login Flow' },
        { id: 'dashboard-overview', text: 'Dashboard Overview' },
        { id: 'navigation', text: 'Navigation' },
        { id: 'daily-workflows', text: 'Daily Workflows' },
        { id: 'key-actions', text: 'Key Actions' },
        { id: 'best-practices', text: 'Tips & Best Practices' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
        { id: 'faqs', text: 'FAQs' },
      ]}
    >
      <h2 id="login-flow">Login Flow</h2>
      <p>
        Sign in at <a href={EXTERNAL.login}>{EXTERNAL.login}</a>. As a buyer, you&rsquo;re routed automatically to{' '}
        <code>{'/buyer/dashboard'}</code> after authentication — there&rsquo;s no separate buyer login page. See{' '}
        <Link href="/getting-started/logging-in">Logging In & Role-Based Routing</Link> for the full flow.
      </p>

      <h2 id="dashboard-overview">Dashboard Overview</h2>
      <p>
        Your buyer dashboard at <a href={EXTERNAL.buyerDashboard}>trade.baalvion.com/buyer/dashboard</a> centers on
        three things: open orders, sourcing activity, and notifications that need your attention. From here you can
        review the status of every trade you&rsquo;re currently party to, without digging into individual order
        pages.
      </p>

      <h2 id="navigation">Navigation</h2>
      <p>
        Buyer navigation is scoped to buyer-relevant sections only — you won&rsquo;t see seller listing management
        or agent task queues. See <Link href="/platform/role-based-navigation">Role-Based Navigation</Link> for how
        this scoping works across the platform.
      </p>

      <h2 id="daily-workflows">Daily Workflows</h2>
      <ul>
        <li><strong>Review order status</strong> — check which orders are pending, in fulfillment, or completed.</li>
        <li><strong>Respond to messages</strong> — reply to sellers or trade agents on active trades.</li>
        <li><strong>Act on notifications</strong> — approvals, status changes, or requests that need a response.</li>
        <li><strong>Source new trades</strong> — browse or request listings from sellers.</li>
      </ul>

      <h2 id="key-actions">Key Actions</h2>
      <ul>
        <li>Placing an order against a seller&rsquo;s listing.</li>
        <li>Tracking an order&rsquo;s status through fulfillment.</li>
        <li>Messaging a seller or an assigned trade agent about a specific trade.</li>
        <li>Pulling a report of your trade history — see <Link href="/platform/reporting">Reporting</Link>.</li>
      </ul>

      <h2 id="best-practices">Tips & Best Practices</h2>
      <Callout type="tip" title="Keep notification preferences current">
        Review your notification settings under{' '}
        <Link href="/platform/settings-profile">Settings & Profile Management</Link> so you don&rsquo;t miss
        time-sensitive order updates.
      </Callout>
      <ul>
        <li>Use search to jump directly to an order or listing rather than scrolling through lists.</li>
        <li>Keep communication about a trade inside that trade&rsquo;s messaging thread, not email — it keeps the record with the order.</li>
      </ul>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <Callout type="warning" title="Placing duplicate orders">
        Refreshing or double-submitting an order form can create duplicate orders. Check your order list before
        resubmitting if a confirmation doesn&rsquo;t appear immediately.
      </Callout>
      <ul>
        <li>Confusing a trade agent&rsquo;s message with a seller&rsquo;s — check the sender before responding.</li>
        <li>Assuming an order is complete once fulfillment starts, rather than waiting for final confirmation.</li>
      </ul>

      <h2 id="faqs">FAQs</h2>
      <FaqAccordion
        items={[
          {
            question: 'Can I cancel an order after placing it?',
            answer: 'Cancellation depends on the order’s current stage. Check the order detail page for available actions, or message the seller directly.',
          },
          {
            question: 'How do I know if a trade agent is assigned to my order?',
            answer: 'Assigned trade agents appear on the order detail page and are included in that order’s messaging thread.',
          },
          {
            question: 'Can I have both buyer and seller access?',
            answer: 'Each account has a single role. An organization operating on both sides typically holds separate buyer and seller accounts.',
          },
        ]}
      />
    </DocPage>
  );
}
