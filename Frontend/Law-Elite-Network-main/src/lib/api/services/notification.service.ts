
import { NotificationRepository } from '../repositories/notification.repository';

export type NotificationType = 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'new_message' | 'verification_update';

export class NotificationService {
  constructor(private repo: NotificationRepository) {}

  async notify(recipientUid: string, type: NotificationType, title: string, message: string, relatedId?: string) {
    if (!recipientUid) return;
    return await this.repo.create({
      recipientUid,
      type,
      title,
      message,
      relatedId
    });
  }

  async markAsRead(notificationId: string) {
    await this.repo.markAsRead(notificationId);
  }
}
