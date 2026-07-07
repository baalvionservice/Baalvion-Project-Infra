import type { Role } from '@/lib/site';

export type RoleSolutionContent = {
  role: Role;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  responsibilities: string[];
  capabilities: { title: string; body: string }[];
  dashboard: string[];
  workflow: { title: string; body: string }[];
  benefits: string[];
  useCasesLabel: string;
  useCases: { title: string; body: string }[];
};

export const SOLUTIONS_CONTENT: Record<Role, RoleSolutionContent> = {
  buyers: {
    role: 'buyers',
    heroEyebrow: 'Solutions for Buyers',
    heroTitle: 'Source with confidence, track every order to the finish line.',
    heroDescription:
      'Raise requirements, compare qualified sellers, and follow every order from approval to delivery — without losing track of a single detail in email.',
    responsibilities: [
      'Define sourcing requirements — specification, quantity, timeline, and budget.',
      'Review and compare quotes submitted by qualified sellers.',
      'Approve terms and confirm orders through a structured workflow.',
      'Track fulfillment and resolve exceptions as they arise.',
    ],
    capabilities: [
      {
        title: 'Structured requirements',
        body: 'Post sourcing needs as structured records instead of loosely specified emails, so sellers respond with comparable, accurate quotes.',
      },
      {
        title: 'Side-by-side comparison',
        body: 'Evaluate competing quotes on price, terms, and delivery timeline in one view instead of stitching together separate threads.',
      },
      {
        title: 'Approval workflow',
        body: 'Route orders through the right internal approvals before commitment, with a clear record of who approved what and when.',
      },
      {
        title: 'Order tracking',
        body: 'Follow a confirmed order through fulfillment and logistics milestones without needing to ask for a status update.',
      },
    ],
    dashboard: [
      'Open requirements and how many quotes each has received.',
      'Orders in progress, grouped by stage of the trade lifecycle.',
      'Pending approvals that need your sign-off.',
      'Upcoming delivery milestones across all active orders.',
    ],
    workflow: [
      { title: 'Post a requirement', body: 'Specify what you need and the terms you are sourcing under.' },
      { title: 'Review quotes', body: 'Compare responses from qualified sellers on equal footing.' },
      { title: 'Approve & confirm', body: 'Move the winning quote through approval into a confirmed order.' },
      { title: 'Track to delivery', body: 'Monitor fulfillment and logistics until the order is complete.' },
    ],
    benefits: [
      'Spend less time chasing sellers for quotes and status updates.',
      'Reduce sourcing errors caused by inconsistent, unstructured requirements.',
      'Give finance and operations a live view of committed spend.',
      'Resolve disputes quickly with a full record of agreed terms.',
    ],
    useCasesLabel: 'Daily use cases',
    useCases: [
      { title: 'Morning review', body: 'Check overnight quotes and approvals waiting in your queue before your first meeting.' },
      { title: 'Sourcing a new requirement', body: 'Post a new specification and let qualified sellers respond directly in-platform.' },
      { title: 'Escalating an exception', body: 'Flag a delayed shipment to your trade agent without leaving the order record.' },
    ],
  },
  sellers: {
    role: 'sellers',
    heroEyebrow: 'Solutions for Sellers',
    heroTitle: 'Respond to real demand, fulfill with a transparent paper trail.',
    heroDescription:
      'See live buyer requirements, submit competitive quotes, and manage fulfillment against an order record both sides can trust.',
    responsibilities: [
      'Respond to buyer requirements with accurate, competitive quotes.',
      'Confirm terms and commit to orders through the platform.',
      'Manage production, shipment, and documentation against each order.',
      'Keep buyers and trade agents updated on fulfillment status.',
    ],
    capabilities: [
      {
        title: 'Live requirement feed',
        body: 'See structured buyer requirements that match your capabilities, instead of relying on inbound referrals or cold outreach.',
      },
      {
        title: 'Quote management',
        body: 'Submit, revise, and track the status of every quote from a single workspace, with clear visibility into where you stand.',
      },
      {
        title: 'Fulfillment tracking',
        body: 'Update shipment and documentation milestones directly against the order, visible to the buyer and trade agent in real time.',
      },
      {
        title: 'Payment visibility',
        body: 'Track invoicing and settlement status against a transparent order trail, reducing disputes over what was agreed.',
      },
    ],
    dashboard: [
      'Open requirements matching your seller profile.',
      'Quotes awaiting buyer decision.',
      'Confirmed orders in active fulfillment.',
      'Outstanding settlement and invoicing status.',
    ],
    workflow: [
      { title: 'Discover requirements', body: 'See buyer requirements that match what you sell.' },
      { title: 'Submit a quote', body: 'Respond with pricing, terms, and delivery commitments.' },
      { title: 'Confirm the order', body: 'Move from accepted quote to a locked, confirmed order.' },
      { title: 'Fulfill & get paid', body: 'Update fulfillment milestones and track settlement to close.' },
    ],
    benefits: [
      'Access qualified demand without spending on lead generation.',
      'Reduce back-and-forth over terms with a structured negotiation record.',
      'Build a track record of on-time fulfillment that strengthens future bids.',
      'Get paid against clear, agreed terms instead of disputed verbal commitments.',
    ],
    useCasesLabel: 'Business value',
    useCases: [
      { title: 'Capacity planning', body: 'See upcoming demand early enough to plan production and logistics capacity.' },
      { title: 'Winning repeat business', body: 'A clean fulfillment record makes you the preferred seller for future requirements.' },
      { title: 'Faster dispute resolution', body: 'Point to the agreed order record instead of relitigating a phone call.' },
    ],
  },
  'trade-agents': {
    role: 'trade-agents',
    heroEyebrow: 'Solutions for Trade Agents',
    heroTitle: 'Coordinate every trade without becoming the bottleneck.',
    heroDescription:
      'Manage tasks, approvals, and workflow coordination between buyers and sellers from one operational view — without chasing status across five inboxes.',
    responsibilities: [
      'Coordinate communication and approvals between buyers and sellers.',
      'Manage the task queue for trades currently in progress.',
      'Verify compliance and documentation at each lifecycle stage.',
      'Escalate and resolve exceptions before they delay a trade.',
    ],
    capabilities: [
      {
        title: 'Unified task queue',
        body: 'See every action pending across all active trades in one prioritized queue, instead of piecing it together from email.',
      },
      {
        title: 'Approval coordination',
        body: 'Route approvals to the right party and track sign-off status without manual follow-up.',
      },
      {
        title: 'Workflow oversight',
        body: 'Monitor where every trade sits in its lifecycle and intervene early when a stage is at risk of slipping.',
      },
      {
        title: 'Exception handling',
        body: 'Flag and resolve issues — delayed documentation, disputed terms, missed milestones — against the order record itself.',
      },
    ],
    dashboard: [
      'Tasks requiring your action across every trade you manage.',
      'Trades at risk of missing a lifecycle milestone.',
      'Pending approvals awaiting buyer or seller response.',
      'Recently resolved exceptions, for a clean audit trail.',
    ],
    workflow: [
      { title: 'Monitor active trades', body: 'Track every trade you coordinate from a single operational view.' },
      { title: 'Route approvals', body: 'Move terms and confirmations to the right party without manual chasing.' },
      { title: 'Verify compliance', body: 'Confirm documentation and requirements are met at each stage.' },
      { title: 'Resolve exceptions', body: 'Step in on delays or disputes before they stall the trade.' },
    ],
    benefits: [
      'Manage more trades simultaneously without losing visibility.',
      'Cut the manual coordination work of relaying status between parties.',
      'Catch at-risk trades earlier with a live operational view.',
      'Maintain a defensible audit trail for every approval and exception.',
    ],
    useCasesLabel: 'Operational efficiency',
    useCases: [
      { title: 'Daily triage', body: 'Start the day by clearing the highest-priority items in your task queue.' },
      { title: 'Approval routing', body: 'Push a pending term change to the right approver in one action.' },
      { title: 'Exception recovery', body: 'Step into a delayed shipment before it becomes a dispute.' },
    ],
  },
};
