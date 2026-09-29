import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/permissions';

export const metadata: Metadata = {
  title: 'Permissions',
  description: 'How access control works for buyers, sellers, and agents on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Permissions"
      description="How the platform decides what an account can see and do."
      toc={[
        { id: 'role-level-permissions', text: 'Role-Level Permissions' },
        { id: 'trade-level-scoping', text: 'Trade-Level Scoping' },
        { id: 'organization-administrators', text: 'Organization Administrators' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
      ]}
    >
      <h2 id="role-level-permissions">Role-Level Permissions</h2>
      <p>
        Every account&rsquo;s permissions start with its role — Buyer, Seller, or Trade Agent. Role determines the
        broad category of actions available: buyers can place orders, sellers can manage listings, agents can act
        on tasks. This is the same layer that drives{' '}
        <Link href="/platform/role-based-navigation">Role-Based Navigation</Link>.
      </p>

      <h2 id="trade-level-scoping">Trade-Level Scoping</h2>
      <p>
        Within a role, access is further scoped to the specific trades you&rsquo;re party to. A buyer can only see
        their own orders, not another buyer&rsquo;s. A trade agent can only act on trades they&rsquo;ve been assigned
        to, not every trade in the system.
      </p>

      <Callout type="note" title="Permissions are enforced, not just hidden">
        Scoping is enforced at the data layer. Even if a URL for another organization&rsquo;s trade were guessed
        directly, the platform would not return that data to an account without permission.
      </Callout>

      <h2 id="organization-administrators">Organization Administrators</h2>
      <p>
        Some accounts hold additional administrative permissions within their organization — for example, managing
        which trade agents are available for assignment, or reviewing organization-wide reporting. These
        permissions are granted by an existing administrator, not self-service.
      </p>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <ul>
        <li>Assuming a missing action button is a bug rather than a permissions boundary — check your role first.</li>
        <li>Sharing login credentials to work around a permissions gap instead of requesting the correct access.</li>
      </ul>
      <p>
        If you believe you&rsquo;re missing a permission you should have, contact your organization administrator or{' '}
        <Link href="/support">support</Link>.
      </p>
    </DocPage>
  );
}
