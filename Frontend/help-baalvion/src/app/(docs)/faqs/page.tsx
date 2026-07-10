import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { FaqAccordion } from '@/components/ui/faq-accordion';

const PATH = '/faqs';

export const metadata: Metadata = {
  title: 'FAQs',
  description: 'Answers to the most common questions about the Baalvion trade platform.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Frequently Asked Questions"
      description="Quick answers to the questions we hear most often, grouped by topic."
      toc={[
        { id: 'login-account', text: 'Login & Account' },
        { id: 'roles-dashboards', text: 'Roles & Dashboards' },
        { id: 'api', text: 'API' },
        { id: 'general', text: 'General' },
      ]}
    >
      <h2 id="login-account">Login & Account</h2>
      <FaqAccordion
        items={[
          {
            question: 'I can’t log in — what should I check first?',
            answer: (
              <>
                Confirm you&rsquo;re using <a href="https://trade.baalvion.com/login">trade.baalvion.com/login</a>{' '}
                and the correct email for your organization. See{' '}
                <Link href="/troubleshooting#cannot-login">Troubleshooting: Cannot Login</Link> for the full
                checklist.
              </>
            ),
          },
          {
            question: 'How do I reset my password?',
            answer: (
              <>
                See <Link href="/getting-started/password-reset">Resetting Your Password</Link> for the full,
                step-by-step flow.
              </>
            ),
          },
          {
            question: 'Why did my session log me out?',
            answer:
              'Sessions expire after a period of inactivity or when signing in from a new device, depending on your organization’s security policy. Simply sign in again.',
          },
        ]}
      />

      <h2 id="roles-dashboards">Roles & Dashboards</h2>
      <FaqAccordion
        items={[
          {
            question: 'I was routed to the wrong dashboard. What’s going on?',
            answer: (
              <>
                Your landing dashboard is determined entirely by your account&rsquo;s role. If it doesn&rsquo;t match
                what you expect, see{' '}
                <Link href="/troubleshooting#wrong-dashboard-redirect">Troubleshooting: Wrong Dashboard
                  Redirect</Link>.
              </>
            ),
          },
          {
            question: 'Can one account have both buyer and seller access?',
            answer:
              'No — each account has a single role. Organizations that trade on both sides typically hold separate buyer and seller accounts.',
          },
          {
            question: 'A sidebar item I expect to see is missing. Why?',
            answer: (
              <>
                This is almost always a role or permission scope issue. See{' '}
                <Link href="/platform/permissions">Permissions</Link> and{' '}
                <Link href="/troubleshooting#missing-sidebar-items">Troubleshooting</Link>.
              </>
            ),
          },
        ]}
      />

      <h2 id="api">API</h2>
      <FaqAccordion
        items={[
          {
            question: 'My API key stopped working. Why?',
            answer: (
              <>
                Keys can be rotated or revoked from your developer settings. Confirm the key is still active, and
                see <Link href="/api/errors">Error Handling</Link> for what a <code>401</code> response means.
              </>
            ),
          },
          {
            question: 'How do I avoid hitting rate limits?',
            answer: (
              <>
                Prefer <Link href="/api/webhooks">webhooks</Link> over polling, and see{' '}
                <Link href="/api/rate-limits">Rate Limits</Link> for current thresholds and headers.
              </>
            ),
          },
        ]}
      />

      <h2 id="general">General</h2>
      <FaqAccordion
        items={[
          {
            question: 'Where do I check system status?',
            answer: 'Real-time platform availability is tracked on the system status page, linked from the Help Center home page.',
          },
          {
            question: 'How do I contact support?',
            answer: (
              <>
                See <Link href="/support">Contact Support</Link> for email, ticketing, and enterprise support
                options.
              </>
            ),
          },
        ]}
      />
    </DocPage>
  );
}
