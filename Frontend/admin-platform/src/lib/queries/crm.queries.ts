import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import { toast } from 'sonner';
import { crmApi } from '@/lib/api/crm';
import type { ApiResponse } from '@/lib/types/common.types';
import type {
  CrmListParams,
  CrmListResult,
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
} from '@/lib/types/crm.types';

// The CRUD surface every CRM resource exposes (see crmApi in lib/api/crm.ts).
interface CrmResourceApi<T, P> {
  list: (params?: CrmListParams) => Promise<AxiosResponse<ApiResponse<CrmListResult<T>>>>;
  get: (id: string) => Promise<AxiosResponse<ApiResponse<T>>>;
  create: (payload: P) => Promise<AxiosResponse<ApiResponse<T>>>;
  update: (id: string, payload: Partial<P>) => Promise<AxiosResponse<ApiResponse<T>>>;
  delete: (id: string) => Promise<AxiosResponse<ApiResponse<void>>>;
}

const crmKeys = {
  all: (resource: string) => ['crm', resource] as const,
  list: (resource: string, p?: Record<string, unknown>) => ['crm', resource, 'list', p] as const,
};

// Shared hook factory — every CRM entity has the identical list/create/update/delete
// surface, so the hooks are generated once (concretely typed per entity below).
function makeCrmHooks<T, P>(resource: string, label: string, api: CrmResourceApi<T, P>) {
  const useList = (params?: CrmListParams) =>
    useQuery({
      queryKey: crmKeys.list(resource, params as Record<string, unknown> | undefined),
      queryFn: () => api.list(params).then((r) => r.data.data),
      placeholderData: keepPreviousData,
    });

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: P) => api.create(payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: crmKeys.all(resource) });
        toast.success(`${label} created`);
      },
      onError: (e: { message: string }) => toast.error(e.message),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<P> }) => api.update(id, payload),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: crmKeys.all(resource) });
        toast.success(`${label} updated`);
      },
      onError: (e: { message: string }) => toast.error(e.message),
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.delete(id),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: crmKeys.all(resource) });
        toast.success(`${label} deleted`);
      },
      onError: (e: { message: string }) => toast.error(e.message),
    });
  };

  return { useList, useCreate, useUpdate, useDelete };
}

// ─── VIP Clients ────────────────────────────────────────────────────────────
const vipClients = makeCrmHooks<VipClient, VipClientPayload>('vip-clients', 'VIP client', crmApi.vipClients);
export const useVipClients = vipClients.useList;
export const useCreateVipClient = vipClients.useCreate;
export const useUpdateVipClient = vipClients.useUpdate;
export const useDeleteVipClient = vipClients.useDelete;

// ─── Segments ───────────────────────────────────────────────────────────────
const segments = makeCrmHooks<Segment, SegmentPayload>('segments', 'Segment', crmApi.segments);
export const useSegments = segments.useList;
export const useCreateSegment = segments.useCreate;
export const useUpdateSegment = segments.useUpdate;
export const useDeleteSegment = segments.useDelete;

// ─── Campaigns ──────────────────────────────────────────────────────────────
const campaigns = makeCrmHooks<Campaign, CampaignPayload>('campaigns', 'Campaign', crmApi.campaigns);
export const useCampaigns = campaigns.useList;
export const useCreateCampaign = campaigns.useCreate;
export const useUpdateCampaign = campaigns.useUpdate;
export const useDeleteCampaign = campaigns.useDelete;

// ─── Vendors ────────────────────────────────────────────────────────────────
const vendors = makeCrmHooks<Vendor, VendorPayload>('vendors', 'Vendor', crmApi.vendors);
export const useVendors = vendors.useList;
export const useCreateVendor = vendors.useCreate;
export const useUpdateVendor = vendors.useUpdate;
export const useDeleteVendor = vendors.useDelete;

// ─── Affiliates ─────────────────────────────────────────────────────────────
const affiliates = makeCrmHooks<Affiliate, AffiliatePayload>('affiliates', 'Affiliate', crmApi.affiliates);
export const useAffiliates = affiliates.useList;
export const useCreateAffiliate = affiliates.useCreate;
export const useUpdateAffiliate = affiliates.useUpdate;
export const useDeleteAffiliate = affiliates.useDelete;

// ─── Appointments ───────────────────────────────────────────────────────────
const appointments = makeCrmHooks<Appointment, AppointmentPayload>('appointments', 'Appointment', crmApi.appointments);
export const useAppointments = appointments.useList;
export const useCreateAppointment = appointments.useCreate;
export const useUpdateAppointment = appointments.useUpdate;
export const useDeleteAppointment = appointments.useDelete;

// ─── Support Tickets ────────────────────────────────────────────────────────
const supportTickets = makeCrmHooks<SupportTicket, SupportTicketPayload>('support-tickets', 'Support ticket', crmApi.supportTickets);
export const useSupportTickets = supportTickets.useList;
export const useCreateSupportTicket = supportTickets.useCreate;
export const useUpdateSupportTicket = supportTickets.useUpdate;
export const useDeleteSupportTicket = supportTickets.useDelete;
