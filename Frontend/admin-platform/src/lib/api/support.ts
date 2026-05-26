import { adminApiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/lib/types/common.types';
import type {
  SupportTicket, TicketMessage, CustomerTimeline, SupportStats, Macro,
  TicketStatus, TicketPriority, TicketCategory,
} from '@/lib/types/support.types';

export const supportApi = {
  // Stats
  getStats: () =>
    adminApiClient.get<ApiResponse<SupportStats>>('/support/stats'),

  // Tickets
  listTickets: (params?: PaginationParams & {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    assigneeId?: string;
    search?: string;
  }) =>
    adminApiClient.get<ApiResponse<PaginatedResponse<SupportTicket>>>('/support/tickets', { params }),

  getTicket: (id: string) =>
    adminApiClient.get<ApiResponse<SupportTicket>>(`/support/tickets/${id}`),

  updateTicket: (id: string, data: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assigneeId' | 'tags'>>) =>
    adminApiClient.patch<ApiResponse<SupportTicket>>(`/support/tickets/${id}`, data),

  assignTicket: (id: string, assigneeId: string) =>
    adminApiClient.post<ApiResponse<SupportTicket>>(`/support/tickets/${id}/assign`, { assigneeId }),

  escalateTicket: (id: string, reason: string) =>
    adminApiClient.post<ApiResponse<SupportTicket>>(`/support/tickets/${id}/escalate`, { reason }),

  closeTicket: (id: string, resolution: string) =>
    adminApiClient.post<ApiResponse<SupportTicket>>(`/support/tickets/${id}/close`, { resolution }),

  // Messages
  listMessages: (ticketId: string) =>
    adminApiClient.get<ApiResponse<TicketMessage[]>>(`/support/tickets/${ticketId}/messages`),

  sendMessage: (ticketId: string, data: { body: string; isInternal: boolean }) =>
    adminApiClient.post<ApiResponse<TicketMessage>>(`/support/tickets/${ticketId}/messages`, data),

  // Customer timeline
  getCustomerTimeline: (userId: string) =>
    adminApiClient.get<ApiResponse<CustomerTimeline>>(`/support/customers/${userId}/timeline`),

  // Macros
  listMacros: () =>
    adminApiClient.get<ApiResponse<Macro[]>>('/support/macros'),

  createMacro: (data: Partial<Macro>) =>
    adminApiClient.post<ApiResponse<Macro>>('/support/macros', data),

  updateMacro: (id: string, data: Partial<Macro>) =>
    adminApiClient.patch<ApiResponse<Macro>>(`/support/macros/${id}`, data),

  deleteMacro: (id: string) =>
    adminApiClient.delete<ApiResponse<void>>(`/support/macros/${id}`),
};
