'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { lightTheme, ThemeType } from './light-theme';
import { darkTheme } from './dark-theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Global Theme Provider for the Imperialpedia Index.
 * Orchestrates visual modes and persistence across the identity cluster.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Audit for existing theme node in local storage
    const savedTheme = localStorage.getItem('imperialpedia_theme_mode') as ThemeMode;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('imperialpedia_theme_mode', themeMode);
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      const effectiveTheme = themeMode === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : themeMode;
        
      root.classList.add(effectiveTheme);

      // TODO: AI-driven theme personalization based on time of day or user behavior
      // TODO: Analytics tracking for theme changes
      // TODO: Dynamic dark/light assets (images, icons) for optimal contrast
    }
  }, [themeMode, mounted]);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
