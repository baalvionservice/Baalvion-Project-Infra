import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/security-model';

export const metadata: Metadata = {
  title: 'Security Model',
  description: 'Authentication, sessions, and how the platform protects your Baalvion account.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Security Model"
      description="How Baalvion protects your account through authentication, sessions, and access boundaries."
      toc={[
        { id: 'authentication', text: 'Authentication' },
        { id: 'sessions', text: 'Sessions' },
        { id: 'account-protection', text: 'Account Protection' },
        { id: 'reporting-a-concern', text: 'Reporting a Security Concern' },
      ]}
    >
      <h2 id="authentication">Authentication</h2>
      <p>
        All accounts authenticate through the single login flow at{' '}
        <a href="https://trade.baalvion.com/login">trade.baalvion.com/login</a>, described in{' '}
        <Link href="/getting-started/logging-in">Logging In & Role-Based Routing</Link>. Your role and permissions
        are attached to your authenticated session and enforced on every request.
      </p>

      <h2 id="sessions">Sessions</h2>
      <p>
        Sessions remain active based on your organization&rsquo;s configured security policy. Extended inactivity or
        signing in from a new device may require re-authentication. Signing out ends your session immediately on
        that device.
      </p>

      <h2 id="account-protection">Account Protection</h2>
      <ul>
        <li>Use a strong, unique password — see <Link href="/getting-started/password-reset">Resetting Your Password</Link>.</li>
        <li>Don&rsquo;t share login credentials between team members — use separate accounts per person instead.</li>
        <li>Report suspicious activity on your account immediately.</li>
      </ul>

      <Callout type="danger" title="Never share your credentials">
        Baalvion staff will never ask for your password. If you receive a request for your credentials, treat it as
        a phishing attempt and report it to <Link href="/support">support</Link>.
      </Callout>

      <h2 id="reporting-a-concern">Reporting a Security Concern</h2>
      <p>
        If you believe your account has been compromised or you&rsquo;ve found a security issue, contact{' '}
        <a href="mailto:security@baalvion.com">security@baalvion.com</a> directly rather than filing a general
        support request.
      </p>
    </DocPage>
  );
}
