
"use client";

import { SubscriptionRepository } from '../repositories/subscription.repository';
import { UserRepository } from '../repositories/user.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { SubscriptionTier, SubscriptionData } from '../types';
import { AnalyticsService } from './analytics.service';

export const SUBSCRIPTION_PLANS = [
  { id: 'BASIC', name: 'Standard Listing', price: 0, features: ['Standard Visibility'] },
  { id: 'PRO', name: 'Professional Tier', price: 2999, features: ['Priority Search Ranking'] },
  { id: 'ELITE', name: 'Elite Practitioner', price: 7999, features: ['Top Search Ranking', 'Elite Badge'] }
];

export class SubscriptionService {
  constructor(
    private subRepo: SubscriptionRepository,
    private userRepo: UserRepository,
    private paymentRepo: PaymentRepository,
    private profileRepo: ProfileRepository,
    private analytics?: AnalyticsService
  ) {}

  async createSubscriptionOrder(uid: string, planId: SubscriptionTier) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error("Invalid plan.");
    const payment = await this.paymentRepo.create({ clientUid: uid, lawyerUid: uid, amount: plan.price, currency: 'INR', type: 'subscription' as any, gateway: 'razorpay' });
    return { paymentId: payment.paymentId, amount: plan.price, planId };
  }

  async activateSubscription(paymentId: string, uid: string, planId: SubscriptionTier) {
    const payment = await this.paymentRepo.getById(paymentId);
    if (!payment || payment.status !== 'success') throw new Error("Payment required.");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1);

    const subscription = await this.subRepo.create({ uid, planId, status: 'active', startDate: startDate.toISOString(), endDate: endDate.toISOString(), paymentId });
    const user = await this.userRepo.findByUid(uid);
    if (user) {
      await this.userRepo.update(user.userId, { subscriptionTier: planId });
      await this.profileRepo.updateProfile('lawyer', user.userId, { 
        subscriptionTier: planId,
        rankingBoost: planId === 'ELITE' ? 100 : planId === 'PRO' ? 50 : 0
      });
    }

    if (this.analytics) {
      this.analytics.logEvent('subscription_purchased', { 
        planId, 
        amount: payment.amount 
      }, uid);
    }

    return subscription;
  }

  async getPlans() { return SUBSCRIPTION_PLANS; }
  async getCurrentSubscription(uid: string) { return await this.subRepo.getLatestByUid(uid); }
}
