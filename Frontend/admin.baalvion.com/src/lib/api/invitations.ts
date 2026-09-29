import { cmsApiClient } from './client';
import type { ApiResponse } from '@/lib/types/common.types';
import type {
  InvitationDetails,
  AcceptInvitationPayload,
  AcceptInvitationResult,
} from '@/lib/types/cms-invitation.types';

/**
 * Token-authenticated contributor-invitation flow. These endpoints are public:
 * the opaque invite token in the path is the only credential, so they must work
 * before the recipient has a session (the request interceptor simply attaches no
 * bearer when there is none).
 *
 * Backend contract (cms-service):
 *   GET  /cms/invitations/:token          → InvitationDetails
 *   POST /cms/invitations/:token/accept   → AcceptInvitationResult
 */
export const invitationsApi = {
  get: (token: string) =>
    cmsApiClient.get<ApiResponse<InvitationDetails>>(
      `/cms/invitations/${encodeURIComponent(token)}`,
    ),

  accept: (token: string, payload: AcceptInvitationPayload) =>
    cmsApiClient.post<ApiResponse<AcceptInvitationResult>>(
      `/cms/invitations/${encodeURIComponent(token)}/accept`,
      payload,
    ),
};
