import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/listings';

export const metadata: Metadata = {
  title: 'Listings API',
  description: 'Manage product and listing data through the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Listings API"
      description="Manage the listings sellers offer to buyers on the trade platform."
      toc={[
        { id: 'endpoints', text: 'Endpoints' },
        { id: 'the-listing-object', text: 'The Listing Object' },
        { id: 'create-a-listing', text: 'Create a Listing' },
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
            <td><code>/v1/listings</code></td>
            <td>List listings (all listings for buyers, own listings for sellers).</td>
          </tr>
          <tr>
            <td>POST</td>
            <td><code>/v1/listings</code></td>
            <td>Create a listing (seller accounts).</td>
          </tr>
          <tr>
            <td>GET</td>
            <td><code>/v1/listings/:id</code></td>
            <td>Get a single listing by ID.</td>
          </tr>
          <tr>
            <td>PATCH</td>
            <td><code>/v1/listings/:id</code></td>
            <td>Update a listing&rsquo;s details or availability (seller accounts).</td>
          </tr>
        </tbody>
      </table>

      <h2 id="the-listing-object">The Listing Object</h2>
      <CodeBlock
        language="json"
        filename="Listing object"
        code={`{
  "id": "lst_1a4f22",
  "sellerId": "usr_3d7b90",
  "title": "Grade A Basmati Rice",
  "availableQuantity": 12000,
  "unit": "kg",
  "pricePerUnit": 1.42,
  "currency": "USD",
  "status": "active"
}`}
      />

      <h2 id="create-a-listing">Create a Listing</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl -X POST https://api.baalvion.com/v1/listings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Grade A Basmati Rice",
    "availableQuantity": 12000,
    "unit": "kg",
    "pricePerUnit": 1.42,
    "currency": "USD"
  }'`}
      />
      <Callout type="note" title="Seller accounts only">
        Creating and updating listings requires an API key belonging to a seller account.
      </Callout>
    </DocPage>
  );
}
