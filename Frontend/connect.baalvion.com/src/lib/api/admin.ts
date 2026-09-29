
import api from './axios';
import { PlatformStats, SystemLog } from '@/types/admin';
import { User, Transaction, Campaign } from '@/types';
import { ApiResponse } from '@/types/crm';

export const adminApi = {
  getStats: async (): Promise<ApiResponse<PlatformStats>> => {
    const { data } = await api.get('/admin/stats');
    return data;
  },

  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const { data } = await api.get('/admin/users');
    return data;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    const { data } = await api.patch(`/admin/users/${id}`, updates);
    return data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<any>> => {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },

  getPayments: async (): Promise<ApiResponse<Transaction[]>> => {
    const { data } = await api.get('/admin/payments');
    return data;
  },

  getCampaigns: async (): Promise<ApiResponse<Campaign[]>> => {
    const { data } = await api.get('/admin/campaigns');
    return data;
  },

  getLogs: async (): Promise<ApiResponse<SystemLog[]>> => {
    const { data } = await api.get('/admin/logs');
    return data;
  }
};
