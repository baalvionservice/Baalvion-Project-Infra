
"use client";

import { ProfileRepository } from '../repositories/profile.repository';
import { UserRepository } from '../repositories/user.repository';
import { CaseRepository } from '../repositories/case.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { LogRepository } from '../repositories/log.repository';
import { NotificationService } from './notification.service';
import { apiClient } from '@/lib/api/client';

export class AdminService {
  constructor(
    private profileRepo: ProfileRepository,
    private userRepo: UserRepository,
    private caseRepo: CaseRepository,
    private bookingRepo: BookingRepository,
    private analyticsRepo: AnalyticsRepository,
    private logRepo: LogRepository,
    private notificationService: NotificationService,
    _db?: unknown
  ) {}

  async initializeTestNetwork(isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    return { success: true, count: 0 };
  }

  async getAllUsers(isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    const res = await apiClient.get('/admin/users', { params: { limit: 100 } });
    return res.data?.data?.items || res.data?.data || [];
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended', isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    await apiClient.patch(`/admin/users/${userId}/status`, { status });
    return { success: true };
  }

  async seedHierarchy(isAdmin: boolean, seedData: any) {
    if (!isAdmin) throw new Error("Unauthorized.");
    let count = 0;
    for (const cat of seedData.categories || []) {
      try { await apiClient.post('/categories', { name: cat.name, slug: cat.slug, description: cat.description, icon: cat.icon, is_active: true }); count++; } catch {}
    }
    for (const sub of seedData.subcategories || []) {
      try { await apiClient.post('/subcategories', { name: sub.name, slug: sub.slug, category_id: sub.categoryId, is_active: true }); count++; } catch {}
    }
    return { success: true, count };
  }

  async createArticle(isAdmin: boolean, data: any) {
    if (!isAdmin) throw new Error("Unauthorized.");
    const alphabet = (data.title || '').charAt(0).toUpperCase();
    const res = await apiClient.post('/articles', { ...data, alphabet });
    return { id: res.data?.data?.id };
  }

  async getPendingLawyers(_requestingUserId: string, isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    try {
      const res = await apiClient.get('/lawyers', { params: { verificationStatus: 'pending', limit: 50 } });
      return res.data?.data?.items || res.data?.data || [];
    } catch { return []; }
  }

  async approveLawyer(userId: string, _adminId: string, isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    await apiClient.patch(`/lawyers/${userId}/verify`, { status: 'approved' });
    return { success: true };
  }

  async rejectLawyer(userId: string, reason: string, _adminId: string, isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    await this.profileRepo.updateProfile('lawyer', userId, { verificationStatus: 'rejected', rejectionReason: reason });
    return { success: true };
  }

  async getSystemStats(isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    try {
      const res = await apiClient.get('/admin/analytics');
      return res.data?.data || { totalUsers: 0, totalCases: 0, totalBookings: 0, totalRevenue: 0 };
    } catch {
      return { totalUsers: 0, totalCases: 0, totalBookings: 0, totalRevenue: 0 };
    }
  }

  async getSystemLogs(isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    try {
      const res = await apiClient.get('/admin/audit');
      return res.data?.data || [];
    } catch { return []; }
  }

  async getAllCases(isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    const res = await apiClient.get('/cases', { params: { limit: 100 } });
    return res.data?.data?.items || res.data?.data || [];
  }

  async getAllBookings(isAdmin: boolean) {
    if (!isAdmin) throw new Error("Unauthorized.");
    const res = await apiClient.get('/bookings', { params: { limit: 100 } });
    return res.data?.data?.items || res.data?.data || [];
  }

  async deleteArticle(isAdmin: boolean, id: string) {
    if (!isAdmin) throw new Error("Unauthorized.");
    await apiClient.delete(`/articles/${id}`);
  }

  async deleteCategory(isAdmin: boolean, id: string) {
    if (!isAdmin) throw new Error("Unauthorized.");
    await apiClient.delete(`/categories/${id}`);
  }
}
