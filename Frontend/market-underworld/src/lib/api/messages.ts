// Real private 1:1 messaging — community-service's direct_conversations/direct_messages tables.
// Every call goes through the same-origin /api/community-proxy/* bridge (see
// src/lib/api/community.ts's header for why), mirroring that file's proxy convention exactly.
// Distinct from community.ts's community chat (per-community group chat) — this is DMs between
// two specific users, e.g. a buyer messaging the seller of a product.

const PROXY_BASE = '/api/community-proxy';

export interface DirectConversation {
  id: string;
  otherUserId: string;
  contextLabel: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  lastMessage: DirectMessage | null;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

async function messagesFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
    credentials: 'include',
    cache: 'no-store',
  });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || `messages API ${path} failed: ${res.status}`);
  }
  return body.data;
}

export async function startConversation(recipientUserId: string, contextLabel?: string): Promise<DirectConversation> {
  return messagesFetch<DirectConversation>('/messages/conversations', {
    method: 'POST',
    body: JSON.stringify({ recipientUserId, contextLabel }),
  });
}

export async function listConversations(): Promise<DirectConversation[]> {
  return messagesFetch<DirectConversation[]>('/messages/conversations');
}

export async function listMessages(conversationId: string, opts: { before?: string; limit?: number } = {}): Promise<DirectMessage[]> {
  const params = new URLSearchParams();
  if (opts.before) params.set('before', opts.before);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  return messagesFetch<DirectMessage[]>(`/messages/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`);
}

export async function sendDirectMessage(conversationId: string, content: string): Promise<DirectMessage> {
  return messagesFetch<DirectMessage>(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
