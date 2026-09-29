/**
 * @fileOverview ChatService (top-level) — LIVE (law-service messages / Postgres).
 * A "chat" is the message thread for a case (the client↔lawyer conversation). No mock, no Firebase.
 */
import { caseApi, messageApi } from '@/lib/api/client';

const unwrapList = (res: any): any[] => res?.data?.data?.items || (Array.isArray(res?.data?.data) ? res.data.data : []);
const unwrapOne = (res: any) => res?.data?.data ?? null;

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
  timestamp: m.created_at || m.createdAt,
});

const caseToChat = (c: any) => ({
  id: String(c.id),
  caseId: String(c.id),
  title: c.title,
  participants: [c.client?.name, c.lawyer?.name].filter(Boolean),
  clientName: c.client?.name,
  lawyerName: c.lawyer?.name,
  lastMessage: '',
  status: c.status,
  updatedAt: c.updated_at || c.updatedAt,
  messages: [] as any[],
});

/** Each of the member's cases is a conversation channel. */
export const getUserChats = async (_userId?: string) => {
  const cases = unwrapList(await caseApi.list({ limit: 100 }));
  return cases.map(caseToChat);
};

export const getChatById = async (chatId: string) => {
  const [caseRes, msgs] = await Promise.all([
    caseApi.get(chatId).then(unwrapOne).catch(() => null),
    messageApi.list({ case_id: chatId }).then(unwrapList).catch(() => []),
  ]);
  const base = caseRes ? caseToChat(caseRes) : { id: String(chatId), caseId: String(chatId), participants: [], messages: [] as any[] };
  return { ...base, messages: msgs.map(adaptMsg) };
};

export const sendMessage = async (chatId: string, message: any) => {
  await messageApi.send({
    content: message?.text || message?.content || String(message || ''),
    case_id: Number(chatId),
    type: 'text',
  });
};
