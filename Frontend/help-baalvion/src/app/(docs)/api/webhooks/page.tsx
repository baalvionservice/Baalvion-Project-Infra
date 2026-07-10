import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/webhooks';

export const metadata: Metadata = {
  title: 'Webhooks',
  description: 'Subscribe to Baalvion platform events in real time.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Webhooks"
      description="Receive real-time notifications when orders, tasks, and listings change, instead of polling."
      toc={[
        { id: 'setting-up-a-webhook', text: 'Setting Up a Webhook' },
        { id: 'events', text: 'Events' },
        { id: 'payload-example', text: 'Payload Example' },
        { id: 'verifying-signatures', text: 'Verifying Signatures' },
        { id: 'retries', text: 'Retries' },
      ]}
    >
      <h2 id="setting-up-a-webhook">Setting Up a Webhook</h2>
      <p>
        Register an HTTPS endpoint from your dashboard&rsquo;s developer settings, or via the API:
      </p>
      <CodeBlock
        language="bash"
        filename="Register a webhook"
        code={`curl -X POST https://api.baalvion.com/v1/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://yourapp.example.com/webhooks/baalvion",
    "events": ["order.status_changed", "task.approval_requested"]
  }'`}
      />

      <h2 id="events">Events</h2>
      <table>
        <thead>
          <tr>
            <th>Event</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>order.created</code></td>
            <td>A new order was created.</td>
          </tr>
          <tr>
            <td><code>order.status_changed</code></td>
            <td>An order&rsquo;s status changed.</td>
          </tr>
          <tr>
            <td><code>task.approval_requested</code></td>
            <td>A task requires trade agent approval.</td>
          </tr>
          <tr>
            <td><code>task.completed</code></td>
            <td>A task was marked complete.</td>
          </tr>
          <tr>
            <td><code>listing.availability_low</code></td>
            <td>A listing&rsquo;s available quantity dropped below a threshold.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="payload-example">Payload Example</h2>
      <CodeBlock
        language="json"
        filename="order.status_changed"
        code={`{
  "event": "order.status_changed",
  "createdAt": "2026-02-01T12:15:00Z",
  "data": {
    "orderId": "ord_51c9a2",
    "previousStatus": "pending",
    "status": "fulfilling"
  }
}`}
      />

      <h2 id="verifying-signatures">Verifying Signatures</h2>
      <p>
        Every webhook request includes a <code>Baalvion-Signature</code> header — an HMAC-SHA256 signature of the raw
        request body, signed with your webhook&rsquo;s signing secret. Verify it before trusting the payload:
      </p>
      <CodeBlock
        language="javascript"
        filename="verify.js"
        code={`const crypto = require('crypto');

function isValidSignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}`}
      />

      <Callout type="warning" title="Always verify before processing">
        An unverified webhook payload could be spoofed by anyone who discovers your endpoint URL. Reject any request
        whose signature doesn&rsquo;t match before acting on it.
      </Callout>

      <h2 id="retries">Retries</h2>
      <p>
        If your endpoint doesn&rsquo;t respond with a <code>2xx</code> status, delivery is retried with exponential
        backoff for up to 24 hours. Respond quickly (acknowledge, then process asynchronously) to avoid unnecessary
        retries.
      </p>
    </DocPage>
  );
}
