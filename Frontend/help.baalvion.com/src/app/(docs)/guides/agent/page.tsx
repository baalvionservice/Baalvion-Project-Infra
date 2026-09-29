import type { Metadata } from 'next';
import Link from 'next/link';
import { DocPage } from '@/components/docs/doc-page';
import { Callout } from '@/components/ui/callout';
import { FaqAccordion } from '@/components/ui/faq-accordion';
import { EXTERNAL } from '@/lib/site';

const PATH = '/guides/agent';

export const metadata: Metadata = {
  title: 'Trade Agent Guide',
  description: 'Task management, workflow coordination, and operational responsibilities for trade agents.',
};

export default function Page() {
  return (
    <DocPage
      pathname={PATH}
      title="Trade Agent Guide"
      description="How trade agents coordinate tasks, approvals, and communication between buyers and sellers."
      toc={[
        { id: 'login-flow', text: 'Login Flow' },
        { id: 'task-management', text: 'Task Management' },
        { id: 'workflow-coordination', text: 'Workflow Coordination' },
        { id: 'approvals', text: 'Approvals' },
        { id: 'communication-flow', text: 'Communication Flow' },
        { id: 'operational-responsibilities', text: 'Operational Responsibilities' },
        { id: 'common-mistakes', text: 'Common Mistakes' },
        { id: 'faqs', text: 'FAQs' },
      ]}
    >
      <h2 id="login-flow">Login Flow</h2>
      <p>
        Sign in at <a href={EXTERNAL.login}>{EXTERNAL.login}</a>. Trade agent accounts route automatically to{' '}
        <code>{'/agent/dashboard'}</code>. See <Link href="/getting-started/logging-in">Logging In & Role-Based Routing</Link>{' '}
        for details.
      </p>

      <h2 id="task-management">Task Management</h2>
      <p>
        The agent dashboard at <a href={EXTERNAL.agentDashboard}>trade.baalvion.com/agent/dashboard</a> is organized
        around a task queue — the discrete pieces of work (approvals, checks, coordination steps) needed to move
        assigned trades forward. Tasks are grouped by trade so you can see the full context before acting on any
        single item.
      </p>

      <h2 id="workflow-coordination">Workflow Coordination</h2>
      <p>
        As a trade agent, you sit between the buyer and seller on trades you&rsquo;re assigned to. Your job is to
        keep the trade moving — surfacing blockers, tracking outstanding steps, and making sure both parties have
        what they need at each stage. See <Link href="/getting-started/how-it-works">How the Platform Works</Link>{' '}
        for how this fits into the overall trade lifecycle.
      </p>

      <h2 id="approvals">Approvals</h2>
      <p>
        Certain trade steps require explicit agent approval before the trade can proceed. Approval requests appear
        in your task queue and, depending on your organization&rsquo;s notification settings, as a notification. See{' '}
        <Link href="/platform/notifications">Notifications</Link> for how these alerts work.
      </p>

      <h2 id="communication-flow">Communication Flow</h2>
      <p>
        Agents communicate with both the buyer and the seller inside the trade&rsquo;s messaging thread, so context
        stays attached to the order rather than scattered across separate conversations. See{' '}
        <Link href="/platform/messaging">Messaging</Link> for more detail.
      </p>

      <h2 id="operational-responsibilities">Operational Responsibilities</h2>
      <ul>
        <li>Reviewing and clearing tasks in your queue in priority order.</li>
        <li>Approving or rejecting trade steps that require agent sign-off.</li>
        <li>Keeping both buyer and seller informed of status and blockers.</li>
        <li>Escalating trades that stall or run into disputes.</li>
      </ul>

      <h2 id="common-mistakes">Common Mistakes</h2>
      <Callout type="warning" title="Letting tasks sit unresolved">
        Because approvals often block the buyer or seller&rsquo;s next step, an unresolved task in your queue can
        stall an entire trade. Triage your queue regularly rather than only when notified.
      </Callout>
      <ul>
        <li>Approving a step without reviewing the trade&rsquo;s full messaging history first.</li>
        <li>Communicating with only one party when both need to be kept in the loop.</li>
      </ul>

      <h2 id="faqs">FAQs</h2>
      <FaqAccordion
        items={[
          {
            question: 'How am I assigned to a trade?',
            answer: 'Trade agents are assigned by an organization administrator or automatically based on trade rules configured for your organization.',
          },
          {
            question: 'Can I be removed from a trade once assigned?',
            answer: 'Yes — an administrator can reassign or remove a trade agent from a trade if needed.',
          },
          {
            question: 'What happens if I reject an approval?',
            answer: 'A rejected approval is returned to the trade with your notes, and the buyer or seller is notified so they can address the issue.',
          },
        ]}
      />
    </DocPage>
  );
}
