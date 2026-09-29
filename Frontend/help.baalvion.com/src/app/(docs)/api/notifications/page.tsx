import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';

const PATH = '/api/notifications';

export const metadata: Metadata = {
  title: 'Notifications API',
  description: 'Read and manage notification records through the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Notifications API"
      description="Read the authenticated account's notification records."
      toc={[
        { id: 'endpoints', text: 'Endpoints' },
        { id: 'the-notification-object', text: 'The Notification Object' },
        { id: 'mark-as-read', text: 'Mark as Read' },
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
            <td><code>/v1/notifications</code></td>
            <td>List notifications for the authenticated account.</td>
          </tr>
          <tr>
            <td>PATCH</td>
            <td><code>/v1/notifications/:id</code></td>
            <td>Mark a notification as read.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="the-notification-object">The Notification Object</h2>
      <CodeBlock
        language="json"
        filename="Notification object"
        code={`{
  "id": "ntf_2c81f0",
  "type": "order_status_changed",
  "orderId": "ord_51c9a2",
  "message": "Order ord_51c9a2 status changed to fulfilling",
  "read": false,
  "createdAt": "2026-02-01T12:15:00Z"
}`}
      />

      <h2 id="mark-as-read">Mark as Read</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl -X PATCH https://api.baalvion.com/v1/notifications/ntf_2c81f0 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "read": true }'`}
      />
      <p>
        For real-time delivery instead of polling, subscribe to the equivalent events via{' '}
        <a href="/api/webhooks">Webhooks</a>.
      </p>
    </DocPage>
  );
}
