import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/errors';

export const metadata: Metadata = {
  title: 'Error Handling',
  description: 'Standard error codes and a debugging guide for the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Error Handling"
      description="How errors are structured, the standard error codes, and how to debug a failing request."
      toc={[
        { id: 'error-shape', text: 'Error Shape' },
        { id: 'http-status-codes', text: 'HTTP Status Codes' },
        { id: 'error-codes', text: 'Error Codes' },
        { id: 'debugging-guide', text: 'Debugging Guide' },
      ]}
    >
      <h2 id="error-shape">Error Shape</h2>
      <p>Every error response uses the same envelope as a successful response, with <code>success: false</code>:</p>
      <CodeBlock
        language="json"
        filename="Error response"
        code={`{
  "success": false,
  "data": null,
  "error": {
    "code": "validation_error",
    "message": "quantity must be greater than 0",
    "field": "quantity"
  }
}`}
      />

      <h2 id="http-status-codes">HTTP Status Codes</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>400</td>
            <td>Bad request — malformed input or failed validation.</td>
          </tr>
          <tr>
            <td>401</td>
            <td>Missing or invalid credentials.</td>
          </tr>
          <tr>
            <td>403</td>
            <td>Authenticated, but not permitted to perform this action.</td>
          </tr>
          <tr>
            <td>404</td>
            <td>The resource doesn&rsquo;t exist, or isn&rsquo;t visible to your account.</td>
          </tr>
          <tr>
            <td>429</td>
            <td>Rate limit exceeded — see <a href="/api/rate-limits">Rate Limits</a>.</td>
          </tr>
          <tr>
            <td>500</td>
            <td>Unexpected server error. Safe to retry with backoff.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="error-codes">Error Codes</h2>
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>validation_error</code></td>
            <td>A field in the request body failed validation.</td>
          </tr>
          <tr>
            <td><code>invalid_credentials</code></td>
            <td>The API key or token is missing, malformed, or expired.</td>
          </tr>
          <tr>
            <td><code>permission_denied</code></td>
            <td>The authenticated account&rsquo;s role or scope doesn&rsquo;t allow this action.</td>
          </tr>
          <tr>
            <td><code>not_found</code></td>
            <td>The resource ID doesn&rsquo;t exist or isn&rsquo;t visible to this account.</td>
          </tr>
          <tr>
            <td><code>rate_limited</code></td>
            <td>Too many requests — see the <code>Retry-After</code> header.</td>
          </tr>
        </tbody>
      </table>

      <Callout type="note" title="404 vs. 403">
        To avoid leaking whether a resource exists, requests for records outside your permission scope return{' '}
        <code>404 not_found</code> rather than <code>403 permission_denied</code>.
      </Callout>

      <h2 id="debugging-guide">Debugging Guide</h2>
      <ul>
        <li>Check the <code>error.field</code> value on validation errors — it points to the exact offending field.</li>
        <li>A sudden wave of <code>401</code>s usually means a key was rotated or revoked — check your developer settings.</li>
        <li>Confirm the account tied to your API key actually has the role required for the endpoint you&rsquo;re calling.</li>
        <li>For anything unclear, include the request ID from the <code>X-Request-Id</code> response header when contacting <a href="/support">support</a>.</li>
      </ul>
    </DocPage>
  );
}
