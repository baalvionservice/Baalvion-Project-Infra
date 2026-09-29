import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { ContactForm } from '@/components/site/contact-form';
import { Callout } from '@/components/ui/callout';
import { EXTERNAL } from '@/lib/site';

const PATH = '/support';

export const metadata: Metadata = {
  title: 'Contact Support',
  description: 'Get help from the Baalvion team — email, ticketing, and enterprise support options.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Contact Support"
      description="Reach the Baalvion team directly, or check documentation first for the fastest answer."
      toc={[
        { id: 'before-you-contact-us', text: 'Before You Contact Us' },
        { id: 'contact-form', text: 'Contact Form' },
        { id: 'ticket-flow', text: 'What Happens After You Submit' },
        { id: 'direct-email', text: 'Direct Email' },
        { id: 'enterprise-support', text: 'Enterprise Support' },
      ]}
    >
      <h2 id="before-you-contact-us">Before You Contact Us</h2>
      <p>
        Many issues are resolved faster through documentation than through a support ticket. Check{' '}
        <Link href="/troubleshooting">Troubleshooting</Link> and <Link href="/faqs">FAQs</Link> first — they cover
        the most common login, dashboard, and API problems.
      </p>

      <h2 id="contact-form">Contact Form</h2>
      <ContactForm />

      <h2 id="ticket-flow">What Happens After You Submit</h2>
      <ol>
        <li>Your message is sent to the Baalvion support inbox and logged as a ticket.</li>
        <li>You&rsquo;ll receive an automatic acknowledgment with a ticket reference.</li>
        <li>A support team member follows up by email, typically within one business day.</li>
      </ol>

      <Callout type="tip" title="Include the details that speed up a response">
        Mentioning your organization name, account role, and (if relevant) a specific order, trade, or task ID lets
        support investigate immediately instead of asking follow-up questions first.
      </Callout>

      <h2 id="direct-email">Direct Email</h2>
      <p>
        For general support, email <a href={`mailto:${EXTERNAL.supportEmail}`}>{EXTERNAL.supportEmail}</a> directly.
        For security-related concerns specifically, use{' '}
        <a href={`mailto:${EXTERNAL.securityEmail}`}>{EXTERNAL.securityEmail}</a> instead — see{' '}
        <Link href="/platform/security-model">Security Model</Link>.
      </p>

      <h2 id="enterprise-support">Enterprise Support</h2>
      <p>
        Organizations on an enterprise plan have access to a dedicated support channel with faster response-time
        guarantees. Enterprise customers can reach their account team directly, or email{' '}
        <a href={`mailto:${EXTERNAL.enterpriseEmail}`}>{EXTERNAL.enterpriseEmail}</a> to be connected.
      </p>
    </DocPage>
  );
}
