'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeModal: string | null;
  modalData: unknown;
  breadcrumbs: Array<{ label: string; href?: string }>;
  theme: 'light' | 'dark' | 'system';

  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openModal: (id: string, data?: unknown) => void;
  closeModal: () => void;
  setBreadcrumbs: (crumbs: Array<{ label: string; href?: string }>) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      activeModal: null,
      modalData: null,
      breadcrumbs: [],
      theme: 'system',

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      openModal: (id, data = null) => set({ activeModal: id, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'baalvion-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }),
    },
  ),
);
