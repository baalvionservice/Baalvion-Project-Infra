import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';

const PATH = '/api/users';

export const metadata: Metadata = {
  title: 'Users API',
  description: 'Manage user and organization records through the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Users API"
      description="Read and manage user and organization records."
      toc={[
        { id: 'endpoints', text: 'Endpoints' },
        { id: 'the-user-object', text: 'The User Object' },
        { id: 'get-the-current-user', text: 'Get the Current User' },
        { id: 'list-organization-users', text: 'List Organization Users' },
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
            <td><code>/v1/users/me</code></td>
            <td>Get the authenticated user.</td>
          </tr>
          <tr>
            <td>GET</td>
            <td><code>/v1/users</code></td>
            <td>List users in your organization (admin permission required).</td>
          </tr>
          <tr>
            <td>GET</td>
            <td><code>/v1/users/:id</code></td>
            <td>Get a specific user by ID.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="the-user-object">The User Object</h2>
      <CodeBlock
        language="json"
        filename="User object"
        code={`{
  "id": "usr_8f2a1c",
  "email": "buyer@example.com",
  "role": "buyer",
  "organizationId": "org_4b7d9e",
  "createdAt": "2026-01-14T09:30:00Z"
}`}
      />

      <h2 id="get-the-current-user">Get the Current User</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl https://api.baalvion.com/v1/users/me \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
      />
      <CodeBlock
        language="json"
        filename="Response"
        code={`{
  "success": true,
  "data": {
    "id": "usr_8f2a1c",
    "email": "buyer@example.com",
    "role": "buyer",
    "organizationId": "org_4b7d9e"
  },
  "error": null
}`}
      />

      <h2 id="list-organization-users">List Organization Users</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl "https://api.baalvion.com/v1/users?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
      />
      <p>Requires an API key belonging to an account with organization administrator permissions.</p>
    </DocPage>
  );
}
