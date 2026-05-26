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

// Initialize with a mock admin for CMS prototyping
const DEFAULT_MOCK_USER: User = {
  id: 'u-1',
  name: 'Eleanor Vance',
  email: 'eleanor@imperialpedia.com',
  role: 'admin'
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    appLoading: false,
    currentUser: DEFAULT_MOCK_USER,
    platformReady: true,
    environment: process.env.NODE_ENV || 'development',
    notifications: [
      {
        id: 'n-1',
        userId: 'u-1',
        message: 'Welcome to the Imperialpedia Creator Studio.',
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false,
      },
      {
        id: 'n-2',
        userId: 'u-1',
        message: 'Platform Tip: Complete your Expertise Matrix to increase your visibility in the Leaderboard.',
        type: 'info',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: false,
      }
    ],
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
