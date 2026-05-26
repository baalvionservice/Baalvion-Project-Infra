
"use client";

import { AdminService } from '../services/admin.service';
import { ApiResponse } from '../types';

export class AdminController {
  constructor(
    private adminService: AdminService
  ) {}

  async getUsers(req: { isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.getAllUsers(req.isAdmin);
      return { success: true, message: 'Platform users fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async setUserStatus(req: { userId: string; status: 'active' | 'suspended'; isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.updateUserStatus(req.userId, req.status, req.isAdmin);
      return { success: true, message: `Member status updated to ${req.status}`, data };
    } catch (error: any) {
      return { success: false, message: 'Update failed', error: error.message };
    }
  }

  async getPendingLawyers(req: { requestingUserId: string; isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.getPendingLawyers(req.requestingUserId, req.isAdmin);
      return { success: true, message: 'Pending applications fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async approveLawyer(req: { userId: string; adminId: string; isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.approveLawyer(req.userId, req.adminId, req.isAdmin);
      return { success: true, message: 'Practitioner approved', data };
    } catch (error: any) {
      return { success: false, message: 'Approval failed', error: error.message };
    }
  }

  async rejectLawyer(req: { userId: string; reason: string; adminId: string; isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.rejectLawyer(req.userId, req.reason, req.adminId, req.isAdmin);
      return { success: true, message: 'Practitioner rejected', data };
    } catch (error: any) {
      return { success: false, message: 'Rejection failed', error: error.message };
    }
  }

  async getCases(req: { isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.getAllCases(req.isAdmin);
      return { success: true, message: 'Platform cases fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async getBookings(req: { isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.getAllBookings(req.isAdmin);
      return { success: true, message: 'Platform bookings fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async getStats(req: { isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.getSystemStats(req.isAdmin);
      return { success: true, message: 'System intelligence synchronized', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }

  async getLogs(req: { isAdmin: boolean }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.getSystemLogs(req.isAdmin);
      return { success: true, message: 'System logs fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Log fetch failed', error: error.message };
    }
  }

  async seedHierarchy(req: { isAdmin: boolean, seedData: any }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.seedHierarchy(req.isAdmin, req.seedData);
      return { success: true, message: 'Hierarchy synchronized', data };
    } catch (error: any) {
      return { success: false, message: 'Seeding failed', error: error.message };
    }
  }

  async saveArticle(req: { isAdmin: boolean, data: any }): Promise<ApiResponse> {
    try {
      const data = await this.adminService.createArticle(req.isAdmin, req.data);
      return { success: true, message: 'Article committed', data };
    } catch (error: any) {
      return { success: false, message: 'Save failed', error: error.message };
    }
  }

  async deleteArticle(req: { isAdmin: boolean, id: string }): Promise<ApiResponse> {
    try {
      await this.adminService.deleteArticle(req.isAdmin, req.id);
      return { success: true, message: 'Article redacted' };
    } catch (error: any) {
      return { success: false, message: 'Delete failed', error: error.message };
    }
  }

  async deleteCategory(req: { isAdmin: boolean, id: string }): Promise<ApiResponse> {
    try {
      await this.adminService.deleteCategory(req.isAdmin, req.id);
      return { success: true, message: 'Category redacted' };
    } catch (error: any) {
      return { success: false, message: 'Delete failed', error: error.message };
    }
  }
}
