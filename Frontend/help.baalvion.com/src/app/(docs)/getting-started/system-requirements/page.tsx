import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/getting-started/system-requirements';

export const metadata: Metadata = {
  title: 'System Requirements',
  description: 'Supported browsers, devices, and network requirements for the Baalvion trade platform.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="System Requirements"
      description="What you need to run the Baalvion trade platform smoothly."
      toc={[
        { id: 'supported-browsers', text: 'Supported Browsers' },
        { id: 'devices', text: 'Devices' },
        { id: 'network', text: 'Network' },
      ]}
    >
      <h2 id="supported-browsers">Supported Browsers</h2>
      <p>Baalvion is tested against the latest two major versions of:</p>
      <ul>
        <li>Google Chrome</li>
        <li>Mozilla Firefox</li>
        <li>Apple Safari</li>
        <li>Microsoft Edge</li>
      </ul>
      <p>JavaScript and cookies must be enabled. Private/incognito browsing works, but sessions won&rsquo;t persist across windows.</p>

      <Callout type="warning" title="Common mistake: outdated browsers">
        Older browser versions may not support required security or rendering features. If dashboards look broken or
        actions silently fail, updating your browser is the first thing to try — see{' '}
        <a href="/troubleshooting">Troubleshooting</a>.
      </Callout>

      <h2 id="devices">Devices</h2>
      <p>
        The trade platform is designed primarily for desktop and laptop use, where dashboards, tables, and
        multi-step workflows are easiest to work with. It is responsive and usable on tablets. Phone-sized screens
        support core actions (checking status, approving tasks) but are not the primary experience for
        data-heavy workflows like listing management or reporting.
      </p>

      <h2 id="network">Network</h2>
      <p>
        A stable broadband or mobile data connection is recommended. The platform relies on real-time updates for
        notifications and messaging, so connections with frequent drops may cause delayed updates. If your
        organization uses a corporate firewall or VPN, ensure access to <code>trade.baalvion.com</code> and its
        subdomains is allowed.
      </p>
    </DocPage>
  );
}
