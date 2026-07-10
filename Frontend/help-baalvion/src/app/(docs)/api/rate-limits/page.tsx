import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/rate-limits';

export const metadata: Metadata = {
  title: 'Rate Limits',
  description: 'API request limits and best practices for the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Rate Limits"
      description="Request limits per API key, how to read the rate-limit headers, and how to handle them gracefully."
      toc={[
        { id: 'default-limits', text: 'Default Limits' },
        { id: 'rate-limit-headers', text: 'Rate Limit Headers' },
        { id: 'handling-429s', text: 'Handling 429s' },
        { id: 'best-practices', text: 'Best Practices' },
      ]}
    >
      <h2 id="default-limits">Default Limits</h2>
      <table>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Requests / minute</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Standard</td>
            <td>120</td>
          </tr>
          <tr>
            <td>Enterprise</td>
            <td>600</td>
          </tr>
        </tbody>
      </table>
      <p>Limits apply per API key, not per organization — separate keys have separate budgets.</p>

      <h2 id="rate-limit-headers">Rate Limit Headers</h2>
      <p>Every response includes headers describing your current limit status:</p>
      <CodeBlock
        language="http"
        filename="Response headers"
        code={`X-RateLimit-Limit: 120
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1738404600`}
      />

      <h2 id="handling-429s">Handling 429s</h2>
      <p>
        Exceeding your limit returns an HTTP <code>429 Too Many Requests</code> response. Respect the{' '}
        <code>Retry-After</code> header before retrying:
      </p>
      <CodeBlock
        language="json"
        filename="429 response"
        code={`{
  "success": false,
  "data": null,
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Retry after the interval in the Retry-After header."
  }
}`}
      />

      <Callout type="tip" title="Back off exponentially">
        On a 429, wait at least the duration in <code>Retry-After</code>, then back off exponentially on repeated
        limit hits rather than retrying immediately in a tight loop.
      </Callout>

      <h2 id="best-practices">Best Practices</h2>
      <ul>
        <li>Batch reads where possible instead of polling individual records in a loop.</li>
        <li>Prefer <a href="/api/webhooks">webhooks</a> over polling for anything event-driven.</li>
        <li>Cache list responses that don&rsquo;t need to be real-time.</li>
      </ul>
    </DocPage>
  );
}
