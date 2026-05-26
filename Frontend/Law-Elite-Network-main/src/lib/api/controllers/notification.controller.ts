
import { NotificationService } from '../services/notification.service';
import { ApiResponse } from '../types';

export class NotificationController {
  constructor(private service: NotificationService) {}

  async markRead(notificationId: string): Promise<ApiResponse> {
    try {
      await this.service.markAsRead(notificationId);
      return { success: true, message: 'Notification dismissed.' };
    } catch (error: any) {
      return { success: false, message: 'Failed to dismiss', error: error.message };
    }
  }
}
