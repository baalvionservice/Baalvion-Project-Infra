import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/authentication';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'API keys, token-based auth, and how to authenticate requests to the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Authentication"
      description="Every API request must be authenticated with either an API key or a short-lived access token."
      toc={[
        { id: 'api-keys', text: 'API Keys' },
        { id: 'token-based-auth', text: 'Token-Based Auth' },
        { id: 'choosing-an-approach', text: 'Choosing an Approach' },
        { id: 'key-security', text: 'Key Security' },
      ]}
    >
      <h2 id="api-keys">API Keys</h2>
      <p>
        API keys are generated per organization from your dashboard&rsquo;s developer settings and are scoped to the
        role and permissions of the account that created them. Send the key as a bearer token on every request:
      </p>
      <CodeBlock
        language="bash"
        filename="Authenticated request"
        code={`curl https://api.baalvion.com/v1/orders \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
      />

      <h2 id="token-based-auth">Token-Based Auth</h2>
      <p>
        For integrations acting on behalf of a signed-in user (rather than a static server-to-server key), the API
        supports short-lived OAuth 2.0 access tokens obtained via an authorization code flow. Access tokens are sent
        the same way as API keys, in the <code>Authorization</code> header, and expire after 1 hour — use the
        accompanying refresh token to obtain a new one without re-prompting the user.
      </p>
      <CodeBlock
        language="bash"
        filename="Refreshing a token"
        code={`curl -X POST https://api.baalvion.com/v1/oauth/token \\
  -d "grant_type=refresh_token" \\
  -d "refresh_token=YOUR_REFRESH_TOKEN" \\
  -d "client_id=YOUR_CLIENT_ID"`}
      />

      <h2 id="choosing-an-approach">Choosing an Approach</h2>
      <ul>
        <li><strong>API keys</strong> — server-to-server integrations you fully control (ERP sync, internal tooling).</li>
        <li><strong>OAuth tokens</strong> — third-party apps acting on behalf of individual Baalvion users.</li>
      </ul>

      <Callout type="danger" title="Never expose keys client-side">
        API keys carry the full permissions of the account that created them. Never embed a key in frontend
        JavaScript, a mobile app binary, or a public repository — always call the API from a server you control.
      </Callout>

      <h2 id="key-security">Key Security</h2>
      <ul>
        <li>Rotate keys periodically and immediately after any suspected exposure.</li>
        <li>Use separate keys per integration so a compromised key can be revoked without affecting others.</li>
        <li>Store keys in a secrets manager or environment variables — never in source control.</li>
      </ul>
      <p>
        See <Link href="/api/errors">Error Handling</Link> for the response you&rsquo;ll get on an invalid or expired
        credential.
      </p>
    </DocPage>
  );
}
