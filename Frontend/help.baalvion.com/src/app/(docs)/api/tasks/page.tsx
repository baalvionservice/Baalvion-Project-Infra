import type { Metadata } from 'next';
import { DocPage } from '@/components/docs/doc-page';
import { CodeBlock } from '@/components/ui/code-block';
import { Callout } from '@/components/ui/callout';

const PATH = '/api/tasks';

export const metadata: Metadata = {
  title: 'Tasks API',
  description: 'Agent task assignment and status through the Baalvion API.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Tasks API"
      description="Read and update the tasks that make up a trade agent's queue."
      toc={[
        { id: 'endpoints', text: 'Endpoints' },
        { id: 'the-task-object', text: 'The Task Object' },
        { id: 'complete-a-task', text: 'Complete a Task' },
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
            <td><code>/v1/tasks</code></td>
            <td>List tasks assigned to the authenticated agent.</td>
          </tr>
          <tr>
            <td>GET</td>
            <td><code>/v1/tasks/:id</code></td>
            <td>Get a single task by ID.</td>
          </tr>
          <tr>
            <td>PATCH</td>
            <td><code>/v1/tasks/:id</code></td>
            <td>Update a task&rsquo;s status (approve, reject, complete).</td>
          </tr>
        </tbody>
      </table>

      <h2 id="the-task-object">The Task Object</h2>
      <CodeBlock
        language="json"
        filename="Task object"
        code={`{
  "id": "tsk_9e21ab",
  "orderId": "ord_51c9a2",
  "assignedAgentId": "usr_77c1d4",
  "type": "approval",
  "status": "open",
  "dueAt": "2026-02-03T17:00:00Z"
}`}
      />
      <p>
        <code>status</code> is one of <code>open</code>, <code>approved</code>, <code>rejected</code>, or{' '}
        <code>completed</code>.
      </p>

      <h2 id="complete-a-task">Complete a Task</h2>
      <CodeBlock
        language="bash"
        filename="Request"
        code={`curl -X PATCH https://api.baalvion.com/v1/tasks/tsk_9e21ab \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "approved" }'`}
      />
      <Callout type="note" title="Trade agent accounts only">
        Tasks are only assignable to and actionable by trade agent accounts, mirroring{' '}
        <a href="/guides/agent">Trade Agent</a> dashboard workflows.
      </Callout>
    </DocPage>
  );
}
