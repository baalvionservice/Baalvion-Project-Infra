import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Steps, Step } from '@/components/ui/steps';
import { Callout } from '@/components/ui/callout';
import { EXTERNAL } from '@/lib/site';

const PATH = '/getting-started/password-reset';

export const metadata: Metadata = {
  title: 'Resetting Your Password',
  description: 'Step-by-step password recovery instructions for the Baalvion trade platform.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Resetting Your Password"
      description="If you've forgotten your password or need to change it, here's the full recovery flow."
      toc={[
        { id: 'reset-steps', text: 'Reset Steps' },
        { id: 'choosing-a-new-password', text: 'Choosing a New Password' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
        { id: 'faqs', text: 'FAQs' },
      ]}
    >
      <h2 id="reset-steps">Reset Steps</h2>
      <Steps>
        <Step title="Go to the login page">
          Visit <a href={EXTERNAL.login}>{EXTERNAL.login}</a> and select &ldquo;Forgot password?&rdquo;
        </Step>
        <Step title="Enter your email">Enter the email address associated with your Baalvion account.</Step>
        <Step title="Check your inbox">
          You&rsquo;ll receive a password reset link by email, valid for a limited time.
        </Step>
        <Step title="Set a new password">
          Follow the link and choose a new password that meets the platform&rsquo;s security requirements.
        </Step>
        <Step title="Sign in">Return to the login page and sign in with your new password.</Step>
      </Steps>

      <h2 id="choosing-a-new-password">Choosing a New Password</h2>
      <p>Your new password must be different from previous passwords and should be unique to your Baalvion account. Avoid reusing passwords from other services.</p>

      <Callout type="warning" title="Common mistake: expired reset link">
        Password reset links expire after a set window for security. If the link no longer works, restart the reset
        flow from the login page rather than trying an old email link.
      </Callout>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <ul>
        <li>Requesting a reset for the wrong email address (e.g., a personal address instead of your work email).</li>
        <li>Using an expired reset link from an older email.</li>
        <li>Reusing a very recently used password, which the platform may reject.</li>
      </ul>

      <h2 id="faqs">FAQs</h2>
      <p>
        <strong>I didn&rsquo;t receive the reset email.</strong> Check spam/junk folders and confirm you used the
        correct email address. See <Link href="/troubleshooting">Troubleshooting</Link> if the issue persists.
      </p>
      <p>
        <strong>Can I reset my password if I no longer have access to my email?</strong> Contact{' '}
        <Link href="/support">support</Link> — you&rsquo;ll need to verify your identity through an alternate method.
      </p>
    </DocPage>
  );
}
