
/**
 * @deprecated This file is kept for reference only.
 * All notification/automation data is now served by brand-service (:3006) via /api/notifications.
 * Use `notificationApi` from `@/lib/api-client` instead.
 */

import { Notification, AutomationRule } from '@/types/notification';

class MockAutomationDB {
  private notifications: Notification[] = [];
  private rules: AutomationRule[] = [
    { id: 'rule_1', event: 'proposal.sent', action: 'createNotification', enabled: true },
    { id: 'rule_2', event: 'proposal.approved', action: 'createNotification', enabled: true },
    { id: 'rule_3', event: 'payment.completed', action: 'triggerCampaignCreation', enabled: true },
    { id: 'rule_4', event: 'deliverable.submitted', action: 'createNotification', enabled: true },
    { id: 'rule_5', event: 'campaign.completed', action: 'triggerPaymentRelease', enabled: true },
  ];

  constructor() {
    this.seed();
  }

  private seed() {
    this.notifications = Array.from({ length: 12 }).map((_, i) => ({
      id: `nt_${i + 1}`,
      userId: 'mock_user',
      title: i % 2 === 0 ? 'System Update' : 'New Match Found',
      message: i % 2 === 0 
        ? 'Your account security has been verified. Payouts are now enabled.' 
        : 'Our AI has matched you with a new Tech campaign from Lumina.',
      type: i % 3 === 0 ? 'info' : i % 3 === 1 ? 'success' : 'warning',
      read: i > 4,
      createdAt: new Date(Date.now() - i * 3600000 * 4).toISOString(),
    }));
  }

  getNotifications() {
    return this.notifications;
  }

  markAsRead(id: string) {
    const n = this.notifications.find(n => n.id === id);
    if (n) n.read = true;
    return n;
  }

  getRules() {
    return this.rules;
  }

  trigger(event: string, payload: any) {
    const matchingRules = this.rules.filter(r => r.event === event && r.enabled);
    const actionsTaken: string[] = [];

    matchingRules.forEach(rule => {
      actionsTaken.push(rule.action);
      
      // Simulate Notification Creation
      if (rule.action === 'createNotification') {
        this.notifications.unshift({
          id: `nt_auto_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: payload.userId || 'mock_user',
          title: `Action: ${event.split('.').join(' ')}`,
          message: `The system successfully processed ${event} for ${payload.companyName || 'the related project'}.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    });

    return actionsTaken;
  }
}

export const automationDb = new MockAutomationDB();
