import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/notifications';

export const metadata: Metadata = {
  title: 'Notifications',
  description: 'In-app, email, and system notifications and how to manage them on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Notifications"
      description="How Baalvion alerts you to activity that needs your attention, and how to manage your preferences."
      toc={[
        { id: 'notification-types', text: 'Notification Types' },
        { id: 'what-triggers-a-notification', text: 'What Triggers a Notification' },
        { id: 'managing-preferences', text: 'Managing Preferences' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
      ]}
    >
      <h2 id="notification-types">Notification Types</h2>
      <ul>
        <li><strong>In-app notifications</strong> — shown in the notifications area of your dashboard.</li>
        <li><strong>Email notifications</strong> — sent for higher-priority events, such as approvals awaiting action.</li>
      </ul>

      <h2 id="what-triggers-a-notification">What Triggers a Notification</h2>
      <p>Common notification triggers include:</p>
      <ul>
        <li>An order changes status (placed, fulfilled, completed).</li>
        <li>A new message arrives on a trade you&rsquo;re part of.</li>
        <li>An approval is requested from you (trade agents).</li>
        <li>A listing needs attention, such as low availability (sellers).</li>
      </ul>

      <h2 id="managing-preferences">Managing Preferences</h2>
      <p>
        You can adjust which events generate in-app versus email notifications from{' '}
        <Link href="/platform/settings-profile">Settings & Profile Management</Link>. Time-sensitive events, like
        approval requests, generally can&rsquo;t be fully disabled — only the delivery channel can be adjusted.
      </p>

      <Callout type="warning" title="Common mistake: disabling email entirely">
        Turning off email notifications means you&rsquo;ll only see updates when actively logged in. For
        time-sensitive roles like trade agents, this can cause approvals to sit unresolved. Consider keeping email
        on for at least approval-related events.
      </Callout>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <ul>
        <li>Missing notifications that landed in a spam or promotions email folder.</li>
        <li>Assuming an in-app notification was also sent by email — check your preference settings.</li>
      </ul>
    </DocPage>
  );
}
