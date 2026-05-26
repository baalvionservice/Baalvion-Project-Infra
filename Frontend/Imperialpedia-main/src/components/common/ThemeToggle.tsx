'use client';

import React from 'react';
import { useTheme } from '@/design-system/themes/theme-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { trackEvent } from '@/lib/utils/analytics';

/**
 * Institutional Theme Toggle Component.
 * Allows users to shift the platform between Light and Dark discovery modes.
 */
export const ThemeToggle = () => {
  const { themeMode, toggleTheme } = useTheme();

  const handleToggle = () => {
    toggleTheme();
    
    // Broadcast theme shift to the analytics cluster
    trackEvent({
      category: 'UX',
      action: 'Theme Toggle',
      label: themeMode === 'light' ? 'DARK' : 'LIGHT'
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9 rounded-xl border border-white/5 bg-card/30 text-muted-foreground hover:text-primary transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={themeMode === 'light' ? "Switch to dark intelligence mode" : "Switch to light intelligence mode"}
      title={themeMode === 'light' ? "Enable Dark Mode" : "Enable Light Mode"}
    >
      <span className="sr-only">Toggle Discovery Theme</span>
      {themeMode === 'light' ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
};
