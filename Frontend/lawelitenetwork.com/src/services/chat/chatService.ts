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

/** Real unread-message count for the dashboard's "New Messages" widget. */
export const getUnreadMessageCount = async (): Promise<number> => {
  try {
    const res = await messageApi.unreadCount();
    return Number(res?.data?.data?.count ?? 0);
  } catch {
    return 0;
  }
};

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

/** Real binary chat attachment — streamed to MinIO, returns the created `type:'file'` message. */
export const uploadChatFile = async (file: File, opts: { caseId?: string; bookingId?: string; receiverId?: string }) => {
  const form = new FormData();
  form.append('file', file);
  if (opts.caseId) form.append('case_id', opts.caseId);
  if (opts.bookingId) form.append('booking_id', opts.bookingId);
  if (opts.receiverId) form.append('receiver_id', opts.receiverId);
  const res = await messageApi.upload(form);
  return adaptMsg(res?.data?.data);
};

/** Short-lived presigned download URL for a file message's attachment. */
export const getChatFileUrl = async (messageId: string): Promise<string> => {
  const res = await messageApi.downloadUrl(messageId);
  return res?.data?.data?.url || '';
};

/** Ad-hoc video/voice call — mints a room for this conversation and drops a call-invite message. */
export const startChatCall = async (opts: { caseId?: string; bookingId?: string; receiverId?: string; audioOnly?: boolean }) => {
  const res = await messageApi.startCall({
    case_id: opts.caseId ? Number(opts.caseId) : undefined,
    booking_id: opts.bookingId ? Number(opts.bookingId) : undefined,
    receiver_id: opts.receiverId,
    audioOnly: !!opts.audioOnly,
  });
  const data = res?.data?.data;
  return { message: adaptMsg(data?.message), room: data?.room };
};
