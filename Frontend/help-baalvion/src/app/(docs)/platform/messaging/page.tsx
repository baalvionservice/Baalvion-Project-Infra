import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/messaging';

export const metadata: Metadata = {
  title: 'Messaging',
  description: 'Communicating with counterparties and agents inside a trade on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Messaging"
      description="How buyers, sellers, and trade agents communicate inside the platform."
      toc={[
        { id: 'trade-scoped-messaging', text: 'Trade-Scoped Messaging' },
        { id: 'who-can-see-a-thread', text: 'Who Can See a Thread' },
        { id: 'best-practices', text: 'Best Practices' },
      ]}
    >
      <h2 id="trade-scoped-messaging">Trade-Scoped Messaging</h2>
      <p>
        Messaging on Baalvion is attached to a specific trade rather than existing as a general inbox. Every message
        thread lives on the order or trade it relates to, so context never has to be re-explained.
      </p>

      <h2 id="who-can-see-a-thread">Who Can See a Thread</h2>
      <p>
        A trade&rsquo;s messaging thread is visible to the buyer, the seller, and any trade agent assigned to that
        trade — and no one else. If a trade agent is added partway through, they gain access to the full thread
        history at that point. See <Link href="/platform/permissions">Permissions</Link> for how this scoping is
        enforced.
      </p>

      <h2 id="best-practices">Best Practices</h2>
      <Callout type="tip" title="Keep trade discussion in-thread">
        Conducting trade-related discussion over email or outside channels breaks the record attached to the order,
        which makes disputes and reporting harder later. Use the trade&rsquo;s messaging thread as the source of
        truth.
      </Callout>
      <ul>
        <li>Tag the specific order or task a message relates to when a trade has multiple open items.</li>
        <li>Use notifications to confirm a message has been seen rather than assuming silence means agreement.</li>
      </ul>
    </DocPage>
  );
}
