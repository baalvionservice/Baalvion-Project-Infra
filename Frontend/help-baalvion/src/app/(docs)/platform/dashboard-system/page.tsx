import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/dashboard-system';

export const metadata: Metadata = {
  title: 'Dashboard System',
  description: 'How role-based dashboards are structured across the Baalvion platform.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Dashboard System"
      description="How the platform's three dashboards are structured, and what they have in common."
      toc={[
        { id: 'one-dashboard-per-role', text: 'One Dashboard per Role' },
        { id: 'shared-structure', text: 'Shared Structure' },
        { id: 'what-differs', text: 'What Differs by Role' },
      ]}
    >
      <h2 id="one-dashboard-per-role">One Dashboard per Role</h2>
      <p>
        Baalvion has three dashboards — one per role — reachable only through login and role-based routing (never
        directly picked by the user):
      </p>
      <ul>
        <li><code>{'/buyer/dashboard'}</code> — for buyer accounts</li>
        <li><code>{'/seller/dashboard'}</code> — for seller accounts</li>
        <li><code>{'/agent/dashboard'}</code> — for trade agent accounts</li>
      </ul>
      <p>
        See <Link href="/getting-started/logging-in">Logging In & Role-Based Routing</Link> for how you land on the
        correct one.
      </p>

      <h2 id="shared-structure">Shared Structure</h2>
      <p>Every dashboard, regardless of role, is built from the same underlying building blocks:</p>
      <ul>
        <li><strong>An activity summary</strong> — the most relevant open items for your role.</li>
        <li><strong>A primary navigation sidebar</strong> — scoped to what your role can access.</li>
        <li><strong>A notifications area</strong> — items requiring your attention.</li>
        <li><strong>Search</strong> — scoped to the records your role can see.</li>
      </ul>

      <Callout type="note" title="Same system, different content">
        The dashboard layout is consistent across roles, but the data and actions available inside it are entirely
        scoped to your role's permissions. See <Link href="/platform/permissions">Permissions</Link>.
      </Callout>

      <h2 id="what-differs">What Differs by Role</h2>
      <ul>
        <li><strong>Buyer</strong> — dashboard centers on orders placed and sourcing activity.</li>
        <li><strong>Seller</strong> — dashboard centers on incoming orders and listing management.</li>
        <li><strong>Trade Agent</strong> — dashboard centers on a task queue spanning assigned trades.</li>
      </ul>
      <p>
        For workflow-level detail, see the <Link href="/guides/buyer">Buyer</Link>,{' '}
        <Link href="/guides/seller">Seller</Link>, and <Link href="/guides/agent">Trade Agent</Link> guides.
      </p>
    </DocPage>
  );
}
