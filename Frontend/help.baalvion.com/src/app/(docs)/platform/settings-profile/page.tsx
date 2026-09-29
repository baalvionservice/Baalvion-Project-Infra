import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/settings-profile';

export const metadata: Metadata = {
  title: 'Settings & Profile Management',
  description: 'Managing your profile, organization details, and preferences on Baalvion.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Settings & Profile Management"
      description="Where to manage your personal profile, organization details, and platform preferences."
      toc={[
        { id: 'profile-settings', text: 'Profile Settings' },
        { id: 'organization-settings', text: 'Organization Settings' },
        { id: 'notification-preferences', text: 'Notification Preferences' },
        { id: 'security-settings', text: 'Security Settings' },
      ]}
    >
      <h2 id="profile-settings">Profile Settings</h2>
      <p>
        Your profile covers your name, contact details, and how you appear to counterparties in messaging. Keep
        this current — trade agents and counterparties rely on accurate contact details to reach you.
      </p>

      <h2 id="organization-settings">Organization Settings</h2>
      <p>
        Organization-level details (company name, primary contacts, administrators) are managed by users with
        administrator permissions. If you need a change made and don&rsquo;t have admin access, ask your
        organization&rsquo;s administrator.
      </p>

      <h2 id="notification-preferences">Notification Preferences</h2>
      <p>
        Choose which events send an email versus staying in-app only. See{' '}
        <Link href="/platform/notifications">Notifications</Link> for what each event type means.
      </p>

      <Callout type="warning" title="Common mistake: outdated contact email">
        An outdated email address means password resets and time-sensitive notifications go to an address you no
        longer check. Confirm your contact email whenever it changes.
      </Callout>

      <h2 id="security-settings">Security Settings</h2>
      <p>
        Password changes and session management live under security settings. See{' '}
        <Link href="/platform/security-model">Security Model</Link> for how authentication and sessions work.
      </p>
    </DocPage>
  );
}
