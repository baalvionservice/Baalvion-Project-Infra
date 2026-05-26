
import { apiClient } from '@/lib/api/client';

export class ChatRepository {
  constructor() {}

  async findExistingConversation(clientUid: string, lawyerUid: string) {
    try {
      const res = await apiClient.get('/messages', {
        params: { clientUid, lawyerUid, type: 'conversation' }
      });
      const data = res.data?.data;
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch {
      return null;
    }
  }

  async createConversation(data: any) {
    try {
      const res = await apiClient.post('/messages/conversations', data);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async sendMessage(conversationId: string, senderUid: string, text: string) {
    try {
      const res = await apiClient.post('/messages', { conversationId, senderUid, text });
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async getMessages(conversationId: string) {
    try {
      const res = await apiClient.get('/messages', { params: { conversationId } });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }

  // Returns a no-op unsubscribe since real-time is not supported over REST
  getMessagesQuery(_conversationId: string) {
    return null;
  }
}
