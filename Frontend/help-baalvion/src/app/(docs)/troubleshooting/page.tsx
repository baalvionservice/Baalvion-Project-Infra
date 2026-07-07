import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Steps, Step } from '@/components/ui/steps';
import { Callout } from '@/components/ui/callout';
import { EXTERNAL } from '@/lib/site';

const PATH = '/troubleshooting';

export const metadata: Metadata = {
  title: 'Troubleshooting',
  description: 'Step-by-step fixes for common Baalvion trade platform problems.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Troubleshooting Guide"
      description="Step-by-step fixes for the most common problems reported on the trade platform."
      toc={[
        { id: 'cannot-login', text: 'Cannot Login' },
        { id: 'wrong-dashboard-redirect', text: 'Wrong Dashboard Redirect' },
        { id: 'missing-sidebar-items', text: 'Missing Sidebar Items' },
        { id: 'permission-issues', text: 'Permission Issues' },
        { id: 'api-failures', text: 'API Failures' },
        { id: 'browser-issues', text: 'Browser Issues' },
      ]}
    >
      <h2 id="cannot-login">Cannot Login</h2>
      <Steps>
        <Step title="Confirm the URL">
          Make sure you&rsquo;re at <a href={EXTERNAL.login}>{EXTERNAL.login}</a>, not a bookmarked dashboard URL.
        </Step>
        <Step title="Check your email address">
          Confirm you&rsquo;re using the email your organization registered, not a personal address.
        </Step>
        <Step title="Reset your password">
          If you&rsquo;re unsure of your password, use{' '}
          <Link href="/getting-started/password-reset">Resetting Your Password</Link> rather than guessing
          repeatedly — repeated failed attempts can temporarily lock an account.
        </Step>
        <Step title="Clear cookies for the domain">
          A stale or corrupted session cookie can block login. Clear cookies for <code>trade.baalvion.com</code> and
          try again.
        </Step>
        <Step title="Contact support">
          If none of the above works, <Link href="/support">contact support</Link> with your organization name and
          the email you&rsquo;re using.
        </Step>
      </Steps>

      <h2 id="wrong-dashboard-redirect">Wrong Dashboard Redirect</h2>
      <p>
        After login you should land on the dashboard matching your account&rsquo;s role (Buyer, Seller, or Trade
        Agent). If you land on the wrong one:
      </p>
      <ul>
        <li>Confirm with your organization administrator which role your account is assigned.</li>
        <li>Sign out completely and sign back in — a role change made by an administrator only takes effect on your next login.</li>
        <li>If the dashboard is still wrong after a fresh login, <Link href="/support">contact support</Link>.</li>
      </ul>

      <h2 id="missing-sidebar-items">Missing Sidebar Items</h2>
      <p>
        Sidebar navigation is generated from your role and permissions — see{' '}
        <Link href="/platform/role-based-navigation">Role-Based Navigation</Link>. If something is missing:
      </p>
      <ul>
        <li>Confirm the feature is actually part of your role (check the relevant role guide).</li>
        <li>Ask your organization administrator whether an additional permission needs to be granted.</li>
        <li>Refresh the page — navigation is built at login and may not reflect a very recent permission change until you sign in again.</li>
      </ul>

      <h2 id="permission-issues">Permission Issues</h2>
      <Callout type="note" title="Not a bug in most cases">
        A greyed-out action or an inaccessible page is usually the <Link href="/platform/permissions">permissions
        system</Link> working as intended, not a defect.
      </Callout>
      <ul>
        <li>Verify which role and organization the account is scoped to.</li>
        <li>Confirm the specific trade or record in question is one you&rsquo;re actually party to.</li>
        <li>Escalate to your organization administrator if you believe a permission is missing.</li>
      </ul>

      <h2 id="api-failures">API Failures</h2>
      <ul>
        <li>Check the HTTP status code and <code>error.code</code> against <Link href="/api/errors">Error Handling</Link>.</li>
        <li>For <code>401</code> errors, confirm your API key is current and hasn&rsquo;t been rotated.</li>
        <li>For <code>403</code>/<code>404</code> errors, confirm the account behind your key actually has access to the resource.</li>
        <li>For <code>429</code> errors, back off per <Link href="/api/rate-limits">Rate Limits</Link>.</li>
      </ul>

      <h2 id="browser-issues">Browser Issues</h2>
      <ul>
        <li>Confirm your browser meets the <Link href="/getting-started/system-requirements">System Requirements</Link>.</li>
        <li>Disable browser extensions that block scripts or cookies for the trade platform domain.</li>
        <li>Try a private/incognito window to rule out a corrupted local session or cache.</li>
        <li>Hard-refresh the page (clearing cache) after a known platform update.</li>
      </ul>
    </DocPage>
  );
}
