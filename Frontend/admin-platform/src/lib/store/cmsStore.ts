import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Website } from '@/lib/types/cms-website.types';
import type { ContentItem } from '@/lib/types/cms-content.types';

interface CmsState {
  // Active website context
  activeWebsiteId: string | null;
  activeWebsite: Website | null;

  // Editor state
  activeContentId: string | null;
  draftContent: Partial<ContentItem> | null;
  hasUnsavedChanges: boolean;
  lastAutosaveAt: string | null;

  // UI state
  sidebarPanelOpen: boolean;
  activeSidePanel: 'seo' | 'versions' | 'settings' | 'categories' | null;

  // Pending approvals count (badge on nav)
  pendingApprovalsCount: number;

  // Last content-list URL visited per website (pathname + query string), so the
  // editor's "back" link can restore filters/search/page instead of dumping the
  // user back on the unfiltered list.
  lastContentListUrl: Record<string, string>;

  // Actions
  setActiveWebsite: (website: Website | null) => void;
  setActiveWebsiteId: (id: string | null) => void;
  setActiveContent: (contentId: string | null) => void;
  updateDraftContent: (patch: Partial<ContentItem>) => void;
  markSaved: (savedAt?: string) => void;
  markUnsaved: () => void;
  clearDraft: () => void;
  toggleSidePanel: (panel: 'seo' | 'versions' | 'settings' | 'categories') => void;
  closeSidePanel: () => void;
  setPendingApprovalsCount: (count: number) => void;
  setLastContentListUrl: (websiteId: string, url: string) => void;
}

export const useCmsStore = create<CmsState>()(
  persist(
    (set, get) => ({
      activeWebsiteId: null,
      activeWebsite: null,
      activeContentId: null,
      draftContent: null,
      hasUnsavedChanges: false,
      lastAutosaveAt: null,
      sidebarPanelOpen: false,
      activeSidePanel: null,
      pendingApprovalsCount: 0,
      lastContentListUrl: {},

      setActiveWebsite: (website) =>
        set({ activeWebsite: website, activeWebsiteId: website?.id ?? null }),

      setActiveWebsiteId: (id) =>
        set((s) => ({
          activeWebsiteId: id,
          activeWebsite: s.activeWebsite?.id === id ? s.activeWebsite : null,
        })),

      setActiveContent: (contentId) =>
        set({ activeContentId: contentId, draftContent: null, hasUnsavedChanges: false }),

      updateDraftContent: (patch) =>
        set((s) => ({
          draftContent: { ...s.draftContent, ...patch },
          hasUnsavedChanges: true,
        })),

      markSaved: (savedAt) =>
        set({ hasUnsavedChanges: false, lastAutosaveAt: savedAt ?? new Date().toISOString() }),

      markUnsaved: () => set({ hasUnsavedChanges: true }),

      clearDraft: () =>
        set({
          activeContentId: null,
          draftContent: null,
          hasUnsavedChanges: false,
          lastAutosaveAt: null,
          sidebarPanelOpen: false,
          activeSidePanel: null,
        }),

      toggleSidePanel: (panel) =>
        set((s) => ({
          sidebarPanelOpen: s.activeSidePanel === panel ? !s.sidebarPanelOpen : true,
          activeSidePanel: panel,
        })),

      closeSidePanel: () => set({ sidebarPanelOpen: false, activeSidePanel: null }),

      setPendingApprovalsCount: (count) => set({ pendingApprovalsCount: count }),

      setLastContentListUrl: (websiteId, url) =>
        set((s) => ({ lastContentListUrl: { ...s.lastContentListUrl, [websiteId]: url } })),
    }),
    {
      name: 'baalvion-cms',
      partialize: (s) => ({
        activeWebsiteId: s.activeWebsiteId,
        activeWebsite: s.activeWebsite,
        lastContentListUrl: s.lastContentListUrl,
      }),
    }
  )
);
