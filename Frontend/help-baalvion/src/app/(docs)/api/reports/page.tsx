import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';

const PATH = '/api/reports';

export const metadata: Metadata = {
  title: 'Reports API',
  description: 'Retrieve trade and account reports through the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Reports API"
      description="Pull the same report data available on your dashboard for use in your own systems."
      toc={[
        { id: 'endpoints', text: 'Endpoints' },
        { id: 'example-request', text: 'Example Request' },
      ]}
    >
      <h2 id="endpoints">Endpoints</h2>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>GET</td>
            <td><code>/v1/reports/orders</code></td>
            <td>Order volume and status breakdown over a date range.</td>
          </tr>
          <tr>
            <td>GET</td>
            <td><code>/v1/reports/tasks</code></td>
            <td>Task throughput and approval turnaround (trade agent accounts).</td>
          </tr>
        </tbody>
      </table>

      <h2 id="example-request">Example Request</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl "https://api.baalvion.com/v1/reports/orders?from=2026-01-01&to=2026-01-31" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
      />
      <CodeBlock
        language="json"
        filename="Response"
        code={`{
  "success": true,
  "data": {
    "totalOrders": 184,
    "completed": 162,
    "cancelled": 6,
    "pending": 16
  },
  "error": null
}`}
      />
      <p>Report data respects the same permission scoping as every other endpoint — it never includes records you couldn&rsquo;t already see on your dashboard.</p>
    </DocPage>
  );
}
