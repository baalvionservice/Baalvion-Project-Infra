import { apiClient } from '@/lib/apiClient';

export type ApplicationMessage = {
  id: string;
  applicationId: string;
  senderType: 'candidate' | 'staff';
  senderName: string | null;
  senderEmail: string | null;
  body: string;
  readAt: string | null;
  createdAt: string;
};

/**
 * Same thread, two doors: the candidate reaches it through the email-scoped `/me/*`
 * surface (which can only ever resolve their own applications) and staff through the
 * org-scoped ATS route. The caller says which side it is on; the backend decides what
 * that identity is actually allowed to see.
 */
const pathFor = (applicationId: string, side: 'candidate' | 'staff') =>
  side === 'candidate'
    ? `/me/applications/${applicationId}/messages`
    : `/applications/${applicationId}/messages`;

function toMessage(raw: any): ApplicationMessage {
  return {
    id: String(raw.id),
    applicationId: String(raw.applicationId ?? raw.application_id ?? ''),
    senderType: (raw.senderType ?? raw.sender_type) === 'staff' ? 'staff' : 'candidate',
    senderName: raw.senderName ?? raw.sender_name ?? null,
    senderEmail: raw.senderEmail ?? raw.sender_email ?? null,
    body: String(raw.body ?? ''),
    readAt: raw.readAt ?? raw.read_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export const messageService = {
  async list(applicationId: string, side: 'candidate' | 'staff'): Promise<ApplicationMessage[]> {
    const res = await apiClient.get<any[]>(pathFor(applicationId, side));
    if (!res.success || !Array.isArray(res.data)) return [];
    return res.data.map(toMessage);
  },

  async send(applicationId: string, body: string, side: 'candidate' | 'staff'): Promise<ApplicationMessage> {
    const res = await apiClient.post<any>(pathFor(applicationId, side), { body });
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to send message');
    return toMessage(res.data);
  },
};
