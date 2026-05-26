
import { ChatService } from '../services/chat.service';
import { ApiResponse, UserRole } from '../types';

export class ChatController {
  constructor(private chatService: ChatService) {}

  async startConversation(req: { clientUid: string; lawyerUid: string; role: UserRole }): Promise<ApiResponse> {
    try {
      const data = await this.chatService.startConversation(req.clientUid, req.lawyerUid, req.role);
      return { success: true, message: 'Elite channel established.', data };
    } catch (error: any) {
      return { success: false, message: 'Connection failed', error: error.message };
    }
  }

  async sendMessage(req: { conversationId: string; senderUid: string; text: string }): Promise<ApiResponse> {
    try {
      const data = await this.chatService.sendMessage(req.conversationId, req.senderUid, req.text);
      return { success: true, message: 'Message broadcasted.', data };
    } catch (error: any) {
      return { success: false, message: 'Broadcast failed', error: error.message };
    }
  }
}
