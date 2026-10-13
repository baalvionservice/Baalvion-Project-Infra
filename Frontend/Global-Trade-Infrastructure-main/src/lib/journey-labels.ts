/** Plain words for the journey screens. Kept apart from the components so they can be tested. */
import type { StepState } from '@/services/journey-service';

export const STATE_LABEL: Record<StepState, string> = {
  done: 'Done',
  in_progress: 'In progress',
  waiting: 'Waiting',
  blocked: 'Needs attention',
  not_started: 'Not started',
  not_applicable: 'Not needed',
};

const WORDS: Record<string, string> = {
  freight_forwarder: 'Freight forwarder',
  customs_broker: 'Customs broker',
  trade_agent: 'Trade agent',
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return 'Not set';
  return WORDS[role] ?? role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '';
  const s = status.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Where a party goes to do the work of a step. Only offered when it is that party's turn. */
export const STEP_ACTION: Record<string, { label: string; href: string }> = {
  documents: { label: 'Add documents', href: '/documents' },
  transport_booking: { label: 'Book transport', href: '/logistics-shipment' },
  customs: { label: 'Open customs', href: '/customs' },
  in_transit: { label: 'Track the shipment', href: '/shipments' },
  delivery_payment: { label: 'See payments', href: '/payments' },
};

export function routeLabel(origin: string | null | undefined, destination: string | null | undefined): string {
  if (origin && destination) return `${origin} to ${destination}`;
  return origin || destination || 'Route not set';
}
