import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/role-based-navigation';

export const metadata: Metadata = {
  title: 'Role-Based Navigation',
  description: 'How your role determines what you see and where you can go on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Role-Based Navigation"
      description="Navigation on the trade platform is scoped entirely to your account's role."
      toc={[
        { id: 'how-it-works', text: 'How It Works' },
        { id: 'what-you-will-not-see', text: "What You Won't See" },
        { id: 'troubleshooting-missing-items', text: 'Missing Sidebar Items' },
      ]}
    >
      <h2 id="how-it-works">How It Works</h2>
      <p>
        When you log in, the platform reads your account&rsquo;s role and builds a navigation sidebar containing
        only the sections relevant to that role. This happens automatically — there is no manual configuration
        involved for individual users.
      </p>
      <ul>
        <li>Buyers see sourcing, orders, and buyer-facing reporting.</li>
        <li>Sellers see listings, incoming orders, and seller-facing reporting.</li>
        <li>Trade agents see task queues, approvals, and cross-trade coordination views.</li>
      </ul>

      <h2 id="what-you-will-not-see">What You Won&rsquo;t See</h2>
      <p>
        Navigation items outside your role are not just hidden visually — the underlying pages are not accessible to
        your account either. This is enforced by the platform&rsquo;s <Link href="/platform/permissions">permissions
        system</Link>, not just the navigation layer.
      </p>

      <Callout type="note" title="Multiple roles need multiple accounts">
        If your organization operates as both a buyer and a seller, this is handled with separate accounts per role
        rather than one account seeing both navigation sets.
      </Callout>

      <h2 id="troubleshooting-missing-items">Missing Sidebar Items</h2>
      <p>
        If you expect to see a section that isn&rsquo;t in your sidebar, it usually means either your account role
        doesn&rsquo;t include that access, or a permission hasn&rsquo;t been granted by your organization
        administrator. See <Link href="/troubleshooting#missing-sidebar-items">Troubleshooting</Link> for next
        steps.
      </p>
    </DocPage>
  );
}
