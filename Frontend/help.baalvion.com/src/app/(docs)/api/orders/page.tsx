import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/orders';

export const metadata: Metadata = {
  title: 'Orders & Trades API',
  description: 'Create and manage trades and orders through the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Orders & Trades API"
      description="Create, read, and update orders — the core trade record on the platform."
      toc={[
        { id: 'endpoints', text: 'Endpoints' },
        { id: 'the-order-object', text: 'The Order Object' },
        { id: 'create-an-order', text: 'Create an Order' },
        { id: 'update-order-status', text: 'Update Order Status' },
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
            <td><code>/v1/orders</code></td>
            <td>List orders visible to the authenticated account.</td>
          </tr>
          <tr>
            <td>POST</td>
            <td><code>/v1/orders</code></td>
            <td>Create an order (buyer accounts).</td>
          </tr>
          <tr>
            <td>GET</td>
            <td><code>/v1/orders/:id</code></td>
            <td>Get a single order by ID.</td>
          </tr>
          <tr>
            <td>PATCH</td>
            <td><code>/v1/orders/:id</code></td>
            <td>Update an order&rsquo;s status (seller and agent accounts).</td>
          </tr>
        </tbody>
      </table>

      <h2 id="the-order-object">The Order Object</h2>
      <CodeBlock
        language="json"
        filename="Order object"
        code={`{
  "id": "ord_51c9a2",
  "status": "pending",
  "buyerId": "usr_8f2a1c",
  "sellerId": "usr_3d7b90",
  "agentId": null,
  "listingId": "lst_1a4f22",
  "quantity": 500,
  "createdAt": "2026-02-01T11:00:00Z",
  "updatedAt": "2026-02-01T11:00:00Z"
}`}
      />
      <p>
        <code>status</code> is one of <code>pending</code>, <code>confirmed</code>, <code>fulfilling</code>,{' '}
        <code>completed</code>, or <code>cancelled</code>, mirroring the lifecycle described in{' '}
        <Link href="/getting-started/how-it-works">How the Platform Works</Link>.
      </p>

      <h2 id="create-an-order">Create an Order</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl -X POST https://api.baalvion.com/v1/orders \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "listingId": "lst_1a4f22",
    "quantity": 500
  }'`}
      />
      <Callout type="note" title="Buyer accounts only">
        Order creation requires an API key belonging to a buyer account — the same permission boundary as placing an
        order from the dashboard.
      </Callout>

      <h2 id="update-order-status">Update Order Status</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl -X PATCH https://api.baalvion.com/v1/orders/ord_51c9a2 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "fulfilling" }'`}
      />
    </DocPage>
  );
}
