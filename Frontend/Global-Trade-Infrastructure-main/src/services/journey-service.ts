import { apiClient } from '@/lib/api-client';

export type StepState = 'done' | 'in_progress' | 'waiting' | 'blocked' | 'not_started' | 'not_applicable';

export interface JourneyRecordRef {
  kind: string;
  id: string;
  status: string;
  title: string | null;
  [extra: string]: unknown;
}

export interface JourneyStep {
  number: number;
  key: string;
  title: string;
  state: StepState;
  summary: string;
  partial: boolean;
  nextActor: { roles: string[]; text: string; isMyTurn: boolean } | null;
  records: JourneyRecordRef[];
  missing?: string[];
  notes?: string[];
}

export interface JourneySteps {
  journeyId: string;
  orderId: string;
  reference: string;
  origin: string | null;
  destination: string | null;
  incoterm: string | null;
  myRole: string | null;
  steps: JourneyStep[];
  currentStep: string | null;
  progress: { done: number; total: number };
  complete: boolean;
}

export interface JourneySummary {
  id: string;
  reference_no: string;
  origin_country: string | null;
  destination_country: string | null;
  incoterm: string | null;
  commodity: string | null;
  status: string;
  myRole: string;
  created_at: string;
}

export interface JourneyDetail extends JourneySummary {
  parties: { role: string; orgId: string | null; externalName: string | null; status: string }[];
}

async function get<T>(path: string): Promise<T> {
  const res = await apiClient.get<T>(path);
  // A failed call must throw so a screen can say "couldn't load" instead of showing an empty order.
  if (!res.success || res.data == null) throw new Error(res.error?.message || 'Could not load this order');
  return res.data;
}

export const journeyService = {
  list: () => get<JourneySummary[]>('/order_journeys'),
  detail: (id: string) => get<JourneyDetail>(`/order_journeys/${encodeURIComponent(id)}`),
  steps: (id: string) => get<JourneySteps>(`/order_journeys/${encodeURIComponent(id)}/steps`),
};
