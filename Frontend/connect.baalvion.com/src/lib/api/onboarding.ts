
import api from './axios';
import { OnboardingState } from '@/types/onboarding';
import { ApiResponse } from '@/types/crm';

export const onboardingApi = {
  getState: async (): Promise<ApiResponse<OnboardingState>> => {
    const { data } = await api.get('/onboarding');
    return data;
  },

  saveStep: async (step: number, payload: Partial<OnboardingState>): Promise<ApiResponse<OnboardingState>> => {
    const { data } = await api.post('/onboarding/save', { step, ...payload });
    return data;
  },

  complete: async (): Promise<ApiResponse<{ success: boolean }>> => {
    const { data } = await api.post('/onboarding/complete');
    return data;
  }
};
