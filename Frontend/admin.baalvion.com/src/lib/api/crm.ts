import { serviceClients } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type {
  CrmListResult,
  CrmListParams,
  VipClient,
  VipClientPayload,
  Segment,
  SegmentPayload,
  Campaign,
  CampaignPayload,
  Vendor,
  VendorPayload,
  Affiliate,
  AffiliatePayload,
  Appointment,
  AppointmentPayload,
  SupportTicket,
  SupportTicketPayload,
  Inquiry,
  InquiryPayload,
} from '@/lib/types/crm.types';

const client = serviceClients.crm;

// Every CRM entity exposes the same CRUD surface over /crm/<resource>. The list
// response is `ApiResponse<CrmListResult<T>>` ({ success, data:{items,total,…} }).
function crmResource<T, P>(resource: string) {
  return {
    list: (params?: CrmListParams) =>
      client.get<ApiResponse<CrmListResult<T>>>(`/crm/${resource}`, { params }),

    get: (id: string) => client.get<ApiResponse<T>>(`/crm/${resource}/${id}`),

    create: (payload: P) => client.post<ApiResponse<T>>(`/crm/${resource}`, payload),

    update: (id: string, payload: Partial<P>) =>
      client.patch<ApiResponse<T>>(`/crm/${resource}/${id}`, payload),

    delete: (id: string) => client.delete<ApiResponse<void>>(`/crm/${resource}/${id}`),
  };
}

export const crmApi = {
  vipClients: crmResource<VipClient, VipClientPayload>('vip-clients'),
  segments: crmResource<Segment, SegmentPayload>('segments'),
  campaigns: crmResource<Campaign, CampaignPayload>('campaigns'),
  vendors: crmResource<Vendor, VendorPayload>('vendors'),
  affiliates: crmResource<Affiliate, AffiliatePayload>('affiliates'),
  appointments: crmResource<Appointment, AppointmentPayload>('appointments'),
  supportTickets: crmResource<SupportTicket, SupportTicketPayload>('support-tickets'),
  inquiries: {
    ...crmResource<Inquiry, InquiryPayload>('inquiries'),
    // Dedicated append endpoint (POST /crm/inquiries/:id/messages) — the server appends
    // and returns the full updated inquiry; there is deliberately no generic "set messages"
    // path so a stale client array can never clobber someone else's reply.
    addMessage: (id: string, sender: 'client' | 'curator', text: string) =>
      client.post<ApiResponse<Inquiry>>(`/crm/inquiries/${id}/messages`, { sender, text }),
  },
};
