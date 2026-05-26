/**
 * UI State
 * 
 * OWNERSHIP: Client-only, ephemeral
 * SCOPE: Current browser tab
 * PERSISTENCE: None (resets on page reload except preferences)
 * 
 * Contains transient UI state like modals, toasts, and loading indicators.
 */

import { UUID } from "@/contracts/v1/base";
import { AppError, ErrorState, initialErrorState } from "@/contracts/v1/errors";

// ============================================
// UI STATE INTERFACE
// ============================================

export interface UIState {
  // Sidebar & navigation
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  
  // Modals
  activeModal: ModalType | null;
  modalData: Record<string, unknown>;
  
  // Drawers
  activeDrawer: DrawerType | null;
  drawerData: Record<string, unknown>;
  
  // Toasts/Notifications
  toasts: Toast[];
  
  // Global loading
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Error state
  error: ErrorState;
  
  // Tour/Onboarding
  tourActive: boolean;
  tourStep: number;
  tourDismissed: boolean;
  
  // Demo mode
  demoMode: boolean;
  demoDataset: "standard" | "enterprise";
  
  // Keyboard shortcuts
  shortcutsModalOpen: boolean;
  
  // Search
  globalSearchOpen: boolean;
  searchQuery: string;
  
  // Theme (synced with user preferences)
  theme: "light" | "dark" | "system";
  
  // Filters (preserved during session)
  activeFilters: Record<string, unknown>;
  
  // Selection state
  selectedItems: UUID[];
  bulkActionMode: boolean;
}

// ============================================
// MODAL & DRAWER TYPES
// ============================================

export type ModalType =
  | "confirm"
  | "alert"
  | "create-proxy"
  | "edit-proxy"
  | "create-preset"
  | "edit-preset"
  | "invite-user"
  | "upgrade-plan"
  | "compare-plans"
  | "export-data"
  | "api-key"
  | "settings";

export type DrawerType =
  | "proxy-details"
  | "user-details"
  | "provider-details"
  | "incident-details"
  | "notification-center";

// ============================================
// TOAST
// ============================================

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

export const initialUIState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  activeModal: null,
  modalData: {},
  activeDrawer: null,
  drawerData: {},
  toasts: [],
  globalLoading: false,
  loadingMessage: null,
  error: initialErrorState,
  tourActive: false,
  tourStep: 0,
  tourDismissed: false,
  demoMode: false,
  demoDataset: "standard",
  shortcutsModalOpen: false,
  globalSearchOpen: false,
  searchQuery: "",
  theme: "system",
  activeFilters: {},
  selectedItems: [],
  bulkActionMode: false,
};

// ============================================
// UI ACTIONS
// ============================================

export type UIAction =
  // Sidebar
  | { type: "UI_TOGGLE_SIDEBAR" }
  | { type: "UI_SET_SIDEBAR_COLLAPSED"; payload: boolean }
  | { type: "UI_TOGGLE_MOBILE_MENU" }
  // Modal
  | { type: "UI_OPEN_MODAL"; payload: { type: ModalType; data?: Record<string, unknown> } }
  | { type: "UI_CLOSE_MODAL" }
  // Drawer
  | { type: "UI_OPEN_DRAWER"; payload: { type: DrawerType; data?: Record<string, unknown> } }
  | { type: "UI_CLOSE_DRAWER" }
  // Toast
  | { type: "UI_ADD_TOAST"; payload: Omit<Toast, "id"> }
  | { type: "UI_REMOVE_TOAST"; payload: string }
  | { type: "UI_CLEAR_TOASTS" }
  // Loading
  | { type: "UI_SET_LOADING"; payload: { loading: boolean; message?: string } }
  // Error
  | { type: "UI_SET_ERROR"; payload: AppError }
  | { type: "UI_CLEAR_ERROR" }
  | { type: "UI_INCREMENT_RETRY" }
  // Tour
  | { type: "UI_START_TOUR" }
  | { type: "UI_SET_TOUR_STEP"; payload: number }
  | { type: "UI_END_TOUR" }
  | { type: "UI_DISMISS_TOUR" }
  // Demo
  | { type: "UI_TOGGLE_DEMO_MODE" }
  | { type: "UI_SET_DEMO_DATASET"; payload: "standard" | "enterprise" }
  // Theme
  | { type: "UI_SET_THEME"; payload: "light" | "dark" | "system" }
  // Search
  | { type: "UI_TOGGLE_SEARCH" }
  | { type: "UI_SET_SEARCH_QUERY"; payload: string }
  // Filters
  | { type: "UI_SET_FILTER"; payload: { key: string; value: unknown } }
  | { type: "UI_CLEAR_FILTERS" }
  // Selection
  | { type: "UI_SELECT_ITEM"; payload: UUID }
  | { type: "UI_DESELECT_ITEM"; payload: UUID }
  | { type: "UI_SELECT_ALL"; payload: UUID[] }
  | { type: "UI_CLEAR_SELECTION" }
  | { type: "UI_TOGGLE_BULK_MODE" };

// ============================================
// UI REDUCER
// ============================================

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    // Sidebar
    case "UI_TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "UI_SET_SIDEBAR_COLLAPSED":
      return { ...state, sidebarCollapsed: action.payload };
    case "UI_TOGGLE_MOBILE_MENU":
      return { ...state, mobileMenuOpen: !state.mobileMenuOpen };
      
    // Modal
    case "UI_OPEN_MODAL":
      return {
        ...state,
        activeModal: action.payload.type,
        modalData: action.payload.data || {},
      };
    case "UI_CLOSE_MODAL":
      return { ...state, activeModal: null, modalData: {} };
      
    // Drawer
    case "UI_OPEN_DRAWER":
      return {
        ...state,
        activeDrawer: action.payload.type,
        drawerData: action.payload.data || {},
      };
    case "UI_CLOSE_DRAWER":
      return { ...state, activeDrawer: null, drawerData: {} };
      
    // Toast
    case "UI_ADD_TOAST":
      return {
        ...state,
        toasts: [
          ...state.toasts,
          { ...action.payload, id: `toast-${Date.now()}-${Math.random()}` },
        ],
      };
    case "UI_REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };
    case "UI_CLEAR_TOASTS":
      return { ...state, toasts: [] };
      
    // Loading
    case "UI_SET_LOADING":
      return {
        ...state,
        globalLoading: action.payload.loading,
        loadingMessage: action.payload.message || null,
      };
      
    // Error
    case "UI_SET_ERROR":
      return {
        ...state,
        error: {
          hasError: true,
          error: action.payload,
          isRecoverable: action.payload.retryable,
          retryCount: state.error.retryCount,
          maxRetries: 3,
        },
      };
    case "UI_CLEAR_ERROR":
      return { ...state, error: initialErrorState };
    case "UI_INCREMENT_RETRY":
      return {
        ...state,
        error: {
          ...state.error,
          retryCount: state.error.retryCount + 1,
        },
      };
      
    // Tour
    case "UI_START_TOUR":
      return { ...state, tourActive: true, tourStep: 0 };
    case "UI_SET_TOUR_STEP":
      return { ...state, tourStep: action.payload };
    case "UI_END_TOUR":
      return { ...state, tourActive: false };
    case "UI_DISMISS_TOUR":
      return { ...state, tourActive: false, tourDismissed: true };
      
    // Demo
    case "UI_TOGGLE_DEMO_MODE":
      return { ...state, demoMode: !state.demoMode };
    case "UI_SET_DEMO_DATASET":
      return { ...state, demoDataset: action.payload };
      
    // Theme
    case "UI_SET_THEME":
      return { ...state, theme: action.payload };
      
    // Search
    case "UI_TOGGLE_SEARCH":
      return { ...state, globalSearchOpen: !state.globalSearchOpen };
    case "UI_SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
      
    // Filters
    case "UI_SET_FILTER":
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          [action.payload.key]: action.payload.value,
        },
      };
    case "UI_CLEAR_FILTERS":
      return { ...state, activeFilters: {} };
      
    // Selection
    case "UI_SELECT_ITEM":
      return {
        ...state,
        selectedItems: [...state.selectedItems, action.payload],
        bulkActionMode: true,
      };
    case "UI_DESELECT_ITEM":
      return {
        ...state,
        selectedItems: state.selectedItems.filter(id => id !== action.payload),
        bulkActionMode: state.selectedItems.length > 1,
      };
    case "UI_SELECT_ALL":
      return {
        ...state,
        selectedItems: action.payload,
        bulkActionMode: action.payload.length > 0,
      };
    case "UI_CLEAR_SELECTION":
      return { ...state, selectedItems: [], bulkActionMode: false };
    case "UI_TOGGLE_BULK_MODE":
      return { ...state, bulkActionMode: !state.bulkActionMode };
      
    default:
      return state;
  }
}

// ============================================
// UI SELECTORS
// ============================================

export const uiSelectors = {
  isModalOpen: (state: UIState, type: ModalType) => state.activeModal === type,
  isDrawerOpen: (state: UIState, type: DrawerType) => state.activeDrawer === type,
  hasToasts: (state: UIState) => state.toasts.length > 0,
  toastCount: (state: UIState) => state.toasts.length,
  isLoading: (state: UIState) => state.globalLoading,
  hasError: (state: UIState) => state.error.hasError,
  canRetry: (state: UIState) => 
    state.error.isRecoverable && state.error.retryCount < state.error.maxRetries,
  selectedCount: (state: UIState) => state.selectedItems.length,
  hasSelection: (state: UIState) => state.selectedItems.length > 0,
  isTourActive: (state: UIState) => state.tourActive && !state.tourDismissed,
  isDemoMode: (state: UIState) => state.demoMode,
};

// ============================================
// TOAST HELPERS
// ============================================

let toastId = 0;

export function createToast(
  type: Toast["type"],
  title: string,
  message?: string,
  options?: Partial<Toast>
): Omit<Toast, "id"> {
  return {
    type,
    title,
    message,
    duration: options?.duration ?? 5000,
    dismissible: options?.dismissible ?? true,
    action: options?.action,
  };
}

export const toast = {
  success: (title: string, message?: string) => createToast("success", title, message),
  error: (title: string, message?: string) => createToast("error", title, message),
  warning: (title: string, message?: string) => createToast("warning", title, message),
  info: (title: string, message?: string) => createToast("info", title, message),
};
