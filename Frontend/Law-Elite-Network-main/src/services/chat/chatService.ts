/**
 * @fileOverview Chat Service (subfolder) — LIVE (law-service messages / Postgres).
 * No mock, no Firebase. Real-time is approximated by polling the user-scoped thread.
 */
import { messageApi } from '@/lib/api/client';

const unwrapList = (res: any): any[] => res?.data?.data?.items || (Array.isArray(res?.data?.data) ? res.data.data : []);

const adaptMsg = (m: any) => ({
  id: String(m.id),
  caseId: m.case_id != null ? String(m.case_id) : undefined,
  senderId: m.sender_id,
  receiverId: m.receiver_id,
  text: m.content,
  content: m.content,
  type: m.type,
  fileUrl: m.file_url,
  isRead: !!m.read_at,
  createdAt: m.created_at || m.createdAt,
});

export const sendMessage = async (data: { caseId: string; senderId?: string; receiverId?: string; text: string; userRole?: string }) => {
  const res = await messageApi.send({
    content: data.text,
    case_id: data.caseId ? Number(data.caseId) : undefined,
    receiver_id: data.receiverId || undefined,
    type: 'text',
  });
  return res?.data?.data;
};

export const getMessages = async (caseId: string) => {
  const res = await messageApi.list({ case_id: caseId });
  return unwrapList(res).map(adaptMsg);
};

export const subscribeToMessages = (caseId: string, callback: (messages: any[]) => void): (() => void) => {
  let active = true;
  const tick = async () => {
    try {
      const res = await messageApi.list({ case_id: caseId });
      if (active) callback(unwrapList(res).map(adaptMsg));
    } catch { /* transient */ }
  };
  tick();
  const interval = setInterval(tick, 12_000);
  return () => { active = false; clearInterval(interval); };
};

export const markAsRead = async (messageId: string) => {
  const { apiClient } = await import('@/lib/api/client');
  await apiClient.patch(`/messages/${messageId}/read`);
  return { success: true };
};
