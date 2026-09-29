
import api from './axios';
import { Notification } from '@/types/notification';
import { ApiResponse } from '@/types/crm';

export const notificationsApi = {
  getNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    const { data } = await api.get('/notifications');
    return data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  }
};
