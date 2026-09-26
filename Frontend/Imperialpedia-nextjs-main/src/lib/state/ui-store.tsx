"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  activeModal: string | null;
  themeMode: 'light' | 'dark' | 'system';
}

interface UIContextType extends UIState {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UIState>({
    sidebarOpen: true,
    mobileMenuOpen: false,
    activeModal: null,
    themeMode: 'dark',
  });

  const toggleSidebar = () => setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  const setSidebarOpen = (sidebarOpen: boolean) => setState(prev => ({ ...prev, sidebarOpen }));
  const setMobileMenuOpen = (mobileMenuOpen: boolean) => setState(prev => ({ ...prev, mobileMenuOpen }));
  const setActiveModal = (activeModal: string | null) => setState(prev => ({ ...prev, activeModal }));
  const setThemeMode = (themeMode: 'light' | 'dark' | 'system') => setState(prev => ({ ...prev, themeMode }));

  return (
    <UIContext.Provider value={{ 
      ...state, 
      toggleSidebar, 
      setSidebarOpen, 
      setMobileMenuOpen, 
      setActiveModal, 
      setThemeMode 
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIStore() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIStore must be used within a UIProvider');
  }
  return context;
}
