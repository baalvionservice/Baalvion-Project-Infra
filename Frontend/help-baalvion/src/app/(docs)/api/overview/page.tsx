import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { CardGrid, CardLink } from '@/components/ui/card-grid';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/overview';

export const metadata: Metadata = {
  title: 'API Overview',
  description: 'What the Baalvion API is used for and how it is organized.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="API Overview"
      description="Programmatic access to the same trades, orders, listings, and tasks you work with on the Baalvion trade platform."
      toc={[
        { id: 'what-the-api-is-for', text: 'What the API Is For' },
        { id: 'base-url', text: 'Base URL' },
        { id: 'request-response-format', text: 'Request & Response Format' },
        { id: 'how-its-organized', text: "How It's Organized" },
      ]}
    >
      <h2 id="what-the-api-is-for">What the API Is For</h2>
      <p>
        The Baalvion API lets you integrate trade platform data and actions into your own systems: syncing orders
        into an ERP, automating listing updates, pulling reports for internal dashboards, or reacting to trade
        events in real time via webhooks. It mirrors the same permission boundaries as the web application — an API
        key tied to a buyer account can only do what that buyer could do in the dashboard.
      </p>

      <h2 id="base-url">Base URL</h2>
      <CodeBlock language="bash" code={`https://api.baalvion.com/v1`} />

      <h2 id="request-response-format">Request & Response Format</h2>
      <p>All requests and responses use JSON. Every response follows the same envelope:</p>
      <CodeBlock
        language="json"
        filename="Response envelope"
        code={`{
  "success": true,
  "data": { },
  "error": null,
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20
  }
}`}
      />
      <p>
        <code>meta</code> is only present on paginated list endpoints. On errors, <code>success</code> is{' '}
        <code>false</code> and <code>data</code> is <code>null</code> — see <Link href="/api/errors">Error
        Handling</Link>.
      </p>

      <Callout type="note" title="Versioned from day one">
        The current API version is <code>v1</code>, included in the base URL. Breaking changes will ship under a new
        version rather than modifying <code>v1</code> in place.
      </Callout>

      <h2 id="how-its-organized">How It&rsquo;s Organized</h2>
      <CardGrid columns={3}>
        <CardLink href="/api/authentication" title="Authentication" description="API keys and token-based auth." />
        <CardLink href="/api/users" title="Users API" description="Users and organization records." />
        <CardLink href="/api/orders" title="Orders & Trades API" description="Create and manage trades." />
        <CardLink href="/api/listings" title="Listings API" description="Manage product and listing data." />
        <CardLink href="/api/tasks" title="Tasks API" description="Agent task assignment and status." />
        <CardLink href="/api/notifications" title="Notifications API" description="Read notification records." />
        <CardLink href="/api/reports" title="Reports API" description="Retrieve trade and account reports." />
        <CardLink href="/api/webhooks" title="Webhooks" description="Subscribe to platform events." />
        <CardLink href="/api/code-examples" title="Code Examples" description="JavaScript, Python, and cURL." />
      </CardGrid>
    </DocPage>
  );
}
