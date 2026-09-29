import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';

const PATH = '/platform/reporting';

export const metadata: Metadata = {
  title: 'Reporting',
  description: 'Trade, order, and activity reports available on the Baalvion platform.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Reporting"
      description="The trade and activity reports available to each role, and how to use them."
      toc={[
        { id: 'reports-by-role', text: 'Reports by Role' },
        { id: 'exporting-data', text: 'Exporting Data' },
        { id: 'api-access', text: 'API Access to Reports' },
      ]}
    >
      <h2 id="reports-by-role">Reports by Role</h2>
      <ul>
        <li><strong>Buyers</strong> — order history, spend by seller, and sourcing activity over time.</li>
        <li><strong>Sellers</strong> — order volume, fulfillment turnaround, and listing performance.</li>
        <li><strong>Trade Agents</strong> — task throughput and approval turnaround across assigned trades.</li>
      </ul>
      <p>
        Reports are scoped to your role and the trades you have access to — the same boundaries described in{' '}
        <Link href="/platform/permissions">Permissions</Link> apply here too.
      </p>

      <h2 id="exporting-data">Exporting Data</h2>
      <p>
        Reports available on your dashboard can generally be exported for offline analysis or record-keeping. Look
        for the export action on the relevant report view.
      </p>

      <Callout type="note" title="Report data reflects your permission scope">
        An exported report will only ever contain data you already have access to — exporting doesn&rsquo;t bypass
        the platform&rsquo;s permissions.
      </Callout>

      <h2 id="api-access">API Access to Reports</h2>
      <p>
        Programmatic access to report-style data is available through the{' '}
        <Link href="/api/reports">Reports API</Link>, useful for pulling trade activity into your own internal
        systems.
      </p>
    </DocPage>
  );
}
