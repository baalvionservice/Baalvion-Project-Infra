/**
 * @file support-service.ts
 * @description Buyer self-service support ticketing. Backed by trade-service's
 * tenant-scoped /support_tickets resource (tradeops.support_tickets +
 * tradeops.support_ticket_messages).
 */
import { apiClient } from '@/lib/api-client';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketMessage {
  id: string;
  authorUserId: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  relatedEntityType: string;
  relatedEntityId: string;
  resolvedAt: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

function mapMessageFromApi(raw: any): TicketMessage {
  return {
    id: String(raw?.id),
    authorUserId: raw?.author_user_id || '',
    authorRole: raw?.author_role || '',
    body: raw?.body || '',
    createdAt: raw?.created_at || new Date().toISOString(),
  };
}

/**
 * The trade-service SupportTicket model is flat snake_case; the UI speaks camelCase.
 */
function mapTicketFromApi(raw: any): SupportTicket {
  return {
    id: String(raw?.id),
    subject: raw?.subject || '',
    description: raw?.description || '',
    category: raw?.category || '',
    priority: raw?.priority || 'medium',
    status: raw?.status || 'open',
    relatedEntityType: raw?.related_entity_type || '',
    relatedEntityId: raw?.related_entity_id || '',
    resolvedAt: raw?.resolved_at || '',
    createdAt: raw?.created_at || new Date().toISOString(),
    updatedAt: raw?.updated_at || new Date().toISOString(),
    messages: Array.isArray(raw?.messages) ? raw.messages.map(mapMessageFromApi) : [],
  };
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  search?: string;
}

export async function getTickets(filters: TicketFilters = {}): Promise<SupportTicket[]> {
  const res = await apiClient.get<any>('/support_tickets', filters);
  const items = res.data?.items ?? [];
  return items.map(mapTicketFromApi);
}

export async function getTicketById(id: string): Promise<SupportTicket | null> {
  const res = await apiClient.getDoc<any>('/support_tickets', id);
  return res.success && res.data ? mapTicketFromApi(res.data) : null;
}

export interface CreateTicketInput {
  subject: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export async function createTicket(data: CreateTicketInput): Promise<SupportTicket> {
  const res = await apiClient.post<any>('/support_tickets', {
    subject: data.subject,
    description: data.description,
    category: data.category,
    priority: data.priority || 'medium',
    related_entity_type: data.relatedEntityType,
    related_entity_id: data.relatedEntityId,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to create support ticket.');
  }
  return mapTicketFromApi(res.data);
}

export async function addTicketMessage(ticketId: string, body: string): Promise<TicketMessage> {
  const res = await apiClient.post<any>(`/support_tickets/${ticketId}/messages`, { body });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to send reply.');
  }
  return mapMessageFromApi(res.data);
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
  const res = await apiClient.patch<any>(`/support_tickets/${ticketId}/status`, { status });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message || 'Failed to update ticket status.');
  }
  return mapTicketFromApi(res.data);
}

export const supportService = { getTickets, getTicketById, createTicket, addTicketMessage, updateTicketStatus };
