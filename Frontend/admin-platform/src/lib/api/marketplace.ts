import { serviceClients } from './client';
import type { IrListEnvelope, IrResource } from '@/lib/types/ir.types';
import type { MpCompany, MpInvestor, MpDeal, MpOpportunity } from '@/lib/types/marketplace.types';

// marketplace-service admin surface. Lists use the bespoke {data:{items,…}} envelope;
// reviews return {data:<entity>}. Bearer attached by the shared interceptor → the service
// enforces the staff (compliance/admin) PEP.
const mp = serviceClients.marketplace;
type Q = { page?: number; limit?: number; status?: string };

export const marketplaceAdminApi = {
  companies: (p?: Q) => mp.get<IrListEnvelope<MpCompany>>('/admin/companies', { params: p }),
  reviewCompany: (id: string, body: { action: 'approve' | 'reject'; kyc_status?: string; note?: string }) =>
    mp.patch<IrResource<MpCompany>>(`/admin/companies/${id}/review`, body),

  investors: (p?: Q) => mp.get<IrListEnvelope<MpInvestor>>('/admin/investors', { params: p }),
  reviewInvestor: (
    id: string,
    body: { action: 'approve' | 'reject'; kyc_status?: string; aml_status?: string; accreditation_status?: string; note?: string },
  ) => mp.patch<IrResource<MpInvestor>>(`/admin/investors/${id}/review`, body),

  deals: (p?: Q) => mp.get<IrListEnvelope<MpDeal>>('/admin/deals', { params: p }),
  opportunities: (p?: Q) => mp.get<IrListEnvelope<MpOpportunity>>('/admin/opportunities', { params: p }),
  // Escrow release is staff-gated by the service; closes the deal + issues the cap table.
  releaseEscrow: (dealId: string, escrowId: string) =>
    mp.post<IrResource<unknown>>(`/deals/${dealId}/escrow/${escrowId}/release`, {}),
};
