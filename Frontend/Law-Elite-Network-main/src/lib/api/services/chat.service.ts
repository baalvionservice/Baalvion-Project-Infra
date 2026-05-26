
import { ChatRepository } from '../repositories/chat.repository';
import { UserRole } from '../types';
import { NotificationService } from './notification.service';
import { ProfileRepository } from '../repositories/profile.repository';
import { AnalyticsService } from './analytics.service';

export class ChatService {
  constructor(
    private chatRepo: ChatRepository,
    private profileRepo?: ProfileRepository,
    private notificationService?: NotificationService,
    private analytics?: AnalyticsService
  ) {}

  async startConversation(clientUid: string, lawyerUid: string, role: UserRole) {
    if (role !== 'client') throw new Error("Only clients can initiate elite channels.");
    const existing = await this.chatRepo.findExistingConversation(clientUid, lawyerUid);
    if (existing) return existing.data();

    let clientName = 'Client';
    let lawyerName = 'Practitioner';
    if (this.profileRepo) {
      const [cp, lp] = await Promise.all([
        this.profileRepo.getProfile('client', clientUid),
        this.profileRepo.getProfile('lawyer', lawyerUid)
      ]);
      if (cp) clientName = cp.fullName;
      if (lp) lawyerName = lp.fullName;
    }

    return await this.chatRepo.createConversation({
      clientUid, lawyerUid, clientName, lawyerName, participants: [clientUid, lawyerUid],
      lastMessage: 'Conversation established.', lastMessageAt: new Date().toISOString()
    });
  }

  async sendMessage(conversationId: string, senderUid: string, text: string) {
    if (!text.trim()) throw new Error("Message content required.");
    const message = await this.chatRepo.sendMessage(conversationId, senderUid, text);
    
    if (this.analytics) {
      this.analytics.logEvent('message_sent', { 
        conversationId, 
        textLength: text.length 
      }, senderUid);
    }
    
    return message;
  }
}
