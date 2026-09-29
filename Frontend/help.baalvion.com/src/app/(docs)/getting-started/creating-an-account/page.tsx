import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Steps, Step } from '@/components/ui/steps';
import { Callout } from '@/components/ui/callout';
import { EXTERNAL } from '@/lib/site';

const PATH = '/getting-started/creating-an-account';

export const metadata: Metadata = {
  title: 'Creating an Account',
  description: 'How to sign up and get access to the Baalvion trade platform.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Creating an Account"
      description="How to sign up for the Baalvion trade platform as a buyer, seller, or trade agent."
      toc={[
        { id: 'before-you-start', text: 'Before You Start' },
        { id: 'sign-up-steps', text: 'Sign-Up Steps' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
        { id: 'faqs', text: 'FAQs' },
      ]}
    >
      <h2 id="before-you-start">Before You Start</h2>
      <p>
        You&rsquo;ll need a valid email address and, depending on your organization&rsquo;s setup, an invitation from
        an administrator or trade agent. Some organizations pre-provision accounts — check with whoever manages your
        organization&rsquo;s Baalvion access before signing up independently.
      </p>

      <h2 id="sign-up-steps">Sign-Up Steps</h2>
      <Steps>
        <Step title="Go to the login page">
          Visit <a href={EXTERNAL.login}>{EXTERNAL.login}</a> and select the sign-up option.
        </Step>
        <Step title="Choose your role">
          Select whether you are signing up as a Buyer or a Seller. Trade Agent accounts are typically created by an
          organization administrator rather than self-service sign-up.
        </Step>
        <Step title="Enter your details">
          Provide your email address, organization name, and a password, or continue with a supported identity
          provider if one is offered.
        </Step>
        <Step title="Verify your email">
          Confirm the verification link sent to your inbox to activate your account.
        </Step>
        <Step title="Complete onboarding">
          On first login you&rsquo;ll be guided through a short onboarding flow. See{' '}
          <Link href="/getting-started/onboarding">First-Time Onboarding</Link> for details.
        </Step>
      </Steps>

      <Callout type="warning" title="Common mistake: wrong role at sign-up">
        Choosing the wrong role during sign-up (Buyer vs. Seller) determines which dashboard and workflows you get.
        If you selected the wrong role, contact <Link href="/support">support</Link> rather than creating a second
        account.
      </Callout>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <ul>
        <li>Signing up with an email address different from the one your organization invited.</li>
        <li>Missing the verification email because it landed in a spam or promotions folder.</li>
        <li>Creating a duplicate account instead of asking an administrator to fix a role or access issue.</li>
      </ul>

      <h2 id="faqs">FAQs</h2>
      <p>
        <strong>Can I sign up without an invitation?</strong> Buyers and sellers can generally self-register. Trade
        agent access is provisioned by an organization administrator.
      </p>
      <p>
        <strong>What if I don&rsquo;t receive a verification email?</strong> Check spam/junk folders first. If it
        still hasn&rsquo;t arrived after a few minutes, see <Link href="/troubleshooting">Troubleshooting</Link> or{' '}
        <Link href="/support">contact support</Link>.
      </p>
    </DocPage>
  );
}
