
import api from './axios';
import { AutomationRule } from '@/types/notification';
import { ApiResponse } from '@/types/crm';

export const automationApi = {
  getRules: async (): Promise<ApiResponse<AutomationRule[]>> => {
    const { data } = await api.get('/automation/rules');
    return data;
  },

  trigger: async (event: string, payload: any): Promise<ApiResponse<{ actions: string[] }>> => {
    const { data } = await api.post('/automation/trigger', { event, payload });
    return data;
  }
};
