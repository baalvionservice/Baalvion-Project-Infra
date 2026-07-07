import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Steps, Step } from '@/components/ui/steps';
import { Callout } from '@/components/ui/callout';
import { CodeBlock } from '@/components/ui/code-block';
import { EXTERNAL } from '@/lib/site';

const PATH = '/getting-started/logging-in';

export const metadata: Metadata = {
  title: 'Logging In & Role-Based Routing',
  description: 'How login works and how you land on the right dashboard for your role.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Logging In & Role-Based Routing"
      description="Every login goes through one entry point. Where you land next depends on your account's role."
      toc={[
        { id: 'the-login-page', text: 'The Login Page' },
        { id: 'role-based-routing', text: 'Role-Based Routing' },
        { id: 'staying-signed-in', text: 'Staying Signed In' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
      ]}
    >
      <h2 id="the-login-page">The Login Page</h2>
      <p>
        All logins go through <a href={EXTERNAL.login}>{EXTERNAL.login}</a>. There is a single login page for every
        role — Buyer, Seller, and Trade Agent all authenticate the same way.
      </p>
      <Steps>
        <Step title="Go to the login page">
          Open <a href={EXTERNAL.login}>trade.baalvion.com/login</a>.
        </Step>
        <Step title="Enter your credentials">Enter your registered email address and password.</Step>
        <Step title="You are routed automatically">
          After authentication, the platform reads your account role and sends you to the matching dashboard.
        </Step>
      </Steps>

      <h2 id="role-based-routing">Role-Based Routing</h2>
      <p>Once signed in, your role determines your landing page:</p>
      <CodeBlock
        language="http"
        filename="Post-login routing"
        code={`Buyer       → /buyer/dashboard
Seller      → /seller/dashboard
Trade Agent → /agent/dashboard`}
      />
      <p>
        This routing happens automatically — there is no manual dashboard picker. If you land on the wrong dashboard,
        it usually means your account role is set incorrectly; see{' '}
        <Link href="/troubleshooting#wrong-dashboard-redirect">Troubleshooting</Link>.
      </p>

      <Callout type="note" title="One login for every role">
        Buyers, sellers, and trade agents all use the same login page and the same authentication flow. There is no
        separate login URL per role.
      </Callout>

      <h2 id="staying-signed-in">Staying Signed In</h2>
      <p>
        Your session stays active based on your organization&rsquo;s security settings. If you&rsquo;re inactive for
        an extended period, or you sign in from a new device, you may be asked to re-authenticate. See{' '}
        <Link href="/platform/security-model">Security Model</Link> for details on sessions.
      </p>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <ul>
        <li>Bookmarking a specific dashboard URL directly instead of the login page — always start at login.</li>
        <li>Assuming a role change takes effect without signing out and back in.</li>
        <li>Entering credentials for the wrong organization when you belong to more than one.</li>
      </ul>
    </DocPage>
  );
}
