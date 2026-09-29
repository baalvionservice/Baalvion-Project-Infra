import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';
import { CardGrid, CardLink } from '@/components/ui/card-grid';
import { EXTERNAL } from '@/lib/site';

const PATH = '/getting-started/what-is-baalvion';

export const metadata: Metadata = {
  title: 'What Is Baalvion',
  description: 'An overview of the Baalvion trade platform and how its properties fit together.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="What Is Baalvion"
      description="Baalvion is a trade platform that connects buyers, sellers, and trade agents in one place — from sourcing through settlement."
      toc={[
        { id: 'the-trade-platform', text: 'The Trade Platform' },
        { id: 'roles', text: 'Roles on Baalvion' },
        { id: 'the-wider-ecosystem', text: 'The Wider Ecosystem' },
        { id: 'next-steps', text: 'Next Steps' },
      ]}
    >
      <h2 id="the-trade-platform">The Trade Platform</h2>
      <p>
        The core product is the Baalvion Trade Platform at{' '}
        <a href={EXTERNAL.trade}>trade.baalvion.com</a>. It is where buyers source goods, sellers manage listings and
        orders, and trade agents coordinate the operational work in between. Everything in this Help Center is
        written around that application — its dashboards, its navigation, and the workflows each role runs day to
        day.
      </p>

      <h2 id="roles">Roles on Baalvion</h2>
      <p>Every account on the trade platform has exactly one primary role, and each role has its own dashboard:</p>
      <ul>
        <li>
          <strong>Buyer</strong> — sources products, places and tracks orders, from{' '}
          <code>/buyer/dashboard</code>.
        </li>
        <li>
          <strong>Seller</strong> — manages listings, fulfills orders, and tracks trades from{' '}
          <code>/seller/dashboard</code>.
        </li>
        <li>
          <strong>Trade Agent</strong> — coordinates tasks, approvals, and communication between buyers and sellers
          from <code>/agent/dashboard</code>.
        </li>
      </ul>
      <p>
        Your role is set when your account is created and determines which dashboard you land on after login. See{' '}
        <Link href="/platform/role-based-navigation">Role-Based Navigation</Link> for how this works in detail.
      </p>

      <Callout type="note" title="One account, one role">
        Each Baalvion account is tied to a single role. If you need access to a different role&rsquo;s workflows
        (for example, a seller who also needs agent-level task visibility), talk to your organization administrator
        or <Link href="/support">contact support</Link>.
      </Callout>

      <h2 id="the-wider-ecosystem">The Wider Ecosystem</h2>
      <p>Baalvion is more than the trade application. The wider ecosystem includes:</p>
      <CardGrid columns={3}>
        <CardLink
          href={EXTERNAL.marketing}
          title="baalvion.com"
          description="The corporate site — product overview, pricing, and company information."
        />
        <CardLink
          href={EXTERNAL.insights}
          title="about.baalvion.com"
          description="Corporate blog, market research, and trade intelligence."
        />
        <CardLink
          href={EXTERNAL.investors}
          title="ir.baalvion.com"
          description="Investor relations — financial reports and governance."
        />
      </CardGrid>
      <p>This Help Center (help.baalvion.com) documents the trade platform itself and its API.</p>

      <h2 id="next-steps">Next Steps</h2>
      <p>
        Continue to <Link href="/getting-started/how-it-works">How the Platform Works</Link> for a walkthrough of the
        trade lifecycle, or jump straight to{' '}
        <Link href="/getting-started/creating-an-account">Creating an Account</Link> if you&rsquo;re ready to sign
        up.
      </p>
    </DocPage>
  );
}
