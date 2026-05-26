
"use client";

import { SubscriptionService } from '../services/subscription.service';
import { ApiResponse, SubscriptionTier } from '../types';

export class SubscriptionController {
  constructor(private service: SubscriptionService) {}

  async getPlans(): Promise<ApiResponse> {
    try {
      const data = await this.service.getPlans();
      return { success: true, message: 'Plans fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async initiateSubscription(req: { uid: string; planId: SubscriptionTier }): Promise<ApiResponse> {
    try {
      const data = await this.service.createSubscriptionOrder(req.uid, req.planId);
      return { success: true, message: 'Checkout session initiated.', data };
    } catch (error: any) {
      return { success: false, message: 'Subscription initiation failed.', error: error.message };
    }
  }

  async finalizeSubscription(req: { paymentId: string; uid: string; planId: SubscriptionTier }): Promise<ApiResponse> {
    try {
      const data = await this.service.activateSubscription(req.paymentId, req.uid, req.planId);
      return { success: true, message: 'Professional standing upgraded.', data };
    } catch (error: any) {
      return { success: false, message: 'Activation failed.', error: error.message };
    }
  }

  async getStatus(uid: string): Promise<ApiResponse> {
    try {
      const data = await this.service.getCurrentSubscription(uid);
      return { success: true, message: 'Subscription status fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }
}
