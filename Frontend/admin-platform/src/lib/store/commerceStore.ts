import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CommerceStore } from '@/lib/types/commerce.types';

interface CommerceState {
  activeStoreId: string | null;
  activeStore: CommerceStore | null;

  setActiveStore: (store: CommerceStore | null) => void;
  setActiveStoreId: (id: string | null) => void;
  clearStore: () => void;
}

export const useCommerceStore = create<CommerceState>()(
  persist(
    (set, get) => ({
      activeStoreId: null,
      activeStore: null,

      setActiveStore: (store) =>
        set({ activeStore: store, activeStoreId: store?.id ?? null }),

      setActiveStoreId: (id) =>
        set((s) => ({
          activeStoreId: id,
          activeStore: s.activeStore?.id === id ? s.activeStore : null,
        })),

      clearStore: () => set({ activeStore: null, activeStoreId: null }),
    }),
    {
      name: 'baalvion-commerce',
      partialize: (s) => ({
        activeStoreId: s.activeStoreId,
        activeStore: s.activeStore,
      }),
    }
  )
);
