
import { create } from 'zustand';
import { OnboardingState } from '@/types/onboarding';
import { onboardingApi } from '@/lib/api/onboarding';

interface OnboardingStore {
  state: OnboardingState;
  loading: boolean;
  
  fetchState: () => Promise<void>;
  saveStep: (step: number, data: Partial<OnboardingState>) => Promise<void>;
  complete: () => Promise<void>;
  setStep: (step: number) => void;
}

const initialState: OnboardingState = {
  userId: '',
  currentStep: 1,
  completed: false,
  companyName: '',
  industry: '',
  goals: [],
  preferredPlatforms: [],
  budgetRange: ''
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  state: initialState,
  loading: false,

  fetchState: async () => {
    set({ loading: true });
    try {
      const res = await onboardingApi.getState();
      if (res.success) set({ state: res.data });
    } finally {
      set({ loading: false });
    }
  },

  saveStep: async (step, data) => {
    set({ loading: true });
    try {
      const res = await onboardingApi.saveStep(step, data);
      if (res.success) set({ state: res.data });
    } finally {
      set({ loading: false });
    }
  },

  complete: async () => {
    set({ loading: true });
    try {
      await onboardingApi.complete();
      set((s) => ({ state: { ...s.state, completed: true } }));
    } finally {
      set({ loading: false });
    }
  },

  setStep: (step) => set((s) => ({ state: { ...s.state, currentStep: step } })),
}));
