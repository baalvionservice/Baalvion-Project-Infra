import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { CardGrid, CardLink } from '@/components/ui/card-grid';
import { Callout } from '@/components/ui/callout';

const PATH = '/getting-started/onboarding';

export const metadata: Metadata = {
  title: 'First-Time Onboarding',
  description: 'What to expect the first time you sign in to Baalvion, by role.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="First-Time Onboarding"
      description="What happens the first time you sign in, and what to set up before you start trading."
      toc={[
        { id: 'what-happens-on-first-login', text: 'What Happens on First Login' },
        { id: 'onboarding-by-role', text: 'Onboarding by Role' },
        { id: 'before-your-first-trade', text: 'Before Your First Trade' },
      ]}
    >
      <h2 id="what-happens-on-first-login">What Happens on First Login</h2>
      <p>
        The first time you sign in, Baalvion walks you through a short onboarding flow before dropping you into your
        dashboard. This typically covers:
      </p>
      <ul>
        <li>Confirming your organization details.</li>
        <li>Setting your profile information (name, contact details, notification preferences).</li>
        <li>A short tour of your role&rsquo;s dashboard and primary navigation.</li>
      </ul>

      <h2 id="onboarding-by-role">Onboarding by Role</h2>
      <CardGrid columns={3}>
        <CardLink
          href="/guides/buyer"
          title="Buyer onboarding"
          description="Sourcing preferences, dashboard overview, and how to place your first order."
        />
        <CardLink
          href="/guides/seller"
          title="Seller onboarding"
          description="Setting up listings and understanding the order fulfillment workflow."
        />
        <CardLink
          href="/guides/agent"
          title="Trade agent onboarding"
          description="Task queues, approvals, and coordinating your first assigned trade."
        />
      </CardGrid>

      <h2 id="before-your-first-trade">Before Your First Trade</h2>
      <p>Before acting on your first trade, it&rsquo;s worth reviewing:</p>
      <ul>
        <li>
          <Link href="/platform/dashboard-system">Dashboard System</Link> — how your dashboard is organized.
        </li>
        <li>
          <Link href="/platform/notifications">Notifications</Link> — how you&rsquo;ll be alerted to activity that
          needs your attention.
        </li>
        <li>
          <Link href="/platform/settings-profile">Settings & Profile Management</Link> — keeping your organization
          and contact details accurate.
        </li>
      </ul>

      <Callout type="tip" title="Onboarding can be revisited">
        You can review onboarding tips again at any time from your dashboard&rsquo;s help menu — you&rsquo;re not
        limited to a single first-run tour.
      </Callout>
    </DocPage>
  );
}
