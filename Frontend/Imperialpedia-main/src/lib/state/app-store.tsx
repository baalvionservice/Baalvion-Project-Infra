"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';
import { Notification } from '@/modules/content-engine/types/article';

interface AppState {
  appLoading: boolean;
  currentUser: User | null;
  platformReady: boolean;
  environment: string;
  notifications: Notification[];
}

interface AppContextType extends AppState {
  setAppLoading: (loading: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setPlatformReady: (ready: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // `currentUser` here is UI-scratch state only — the real authenticated identity
  // lives in `@/providers/AuthProvider` (useAuth), backed by the RS256 session.
  // This used to default to a fabricated "Eleanor Vance / admin" persona that
  // Sidebar.tsx rendered as if it were the real signed-in user; components needing
  // identity must use useAuth() instead. Notifications start empty (no more
  // fabricated "Welcome" / "Platform Tip" seed content) until a real notifications
  // backend exists.
  const [state, setState] = useState<AppState>({
    appLoading: false,
    currentUser: null,
    platformReady: true,
    environment: process.env.NODE_ENV || 'development',
    notifications: [],
  });

  const setAppLoading = (appLoading: boolean) => setState(prev => ({ ...prev, appLoading }));
  const setCurrentUser = (currentUser: User | null) => setState(prev => ({ ...prev, currentUser }));
  const setPlatformReady = (platformReady: boolean) => setState(prev => ({ ...prev, platformReady }));
  
  const addNotification = (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
    };
    setState(prev => ({ ...prev, notifications: [newNotif, ...prev.notifications] }));
  };

  const markNotificationAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  return (
    <AppContext.Provider value={{ 
      ...state, 
      setAppLoading, 
      setCurrentUser, 
      setPlatformReady, 
      addNotification,
      markNotificationAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
