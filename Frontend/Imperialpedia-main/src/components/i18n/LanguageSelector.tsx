'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages, ChevronDown } from 'lucide-react';
import { i18nConfig } from '@/i18n/config';
import { trackEvent } from '@/lib/utils/analytics';

/**
 * Institutional language selector component.
 * Allows switching between supported discovery dialects.
 * 
 * // TODO: AI-powered translation improvement and content consistency checks
 * // TODO: Regional detection node integration for smart defaults
 */
export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    
    // Broadcast language shift to the analytics cluster
    trackEvent({
      category: 'I18n',
      action: 'Language Switch',
      label: lng.toUpperCase()
    });
  };

  const currentLanguage = i18nConfig.locales.find(l => l === i18n.language) || i18nConfig.defaultLocale;

  const languageNames: Record<string, string> = {
    en: 'English (US)',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    zh: '中文'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-xl border border-white/5 bg-card/30 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all">
          <Languages className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{languageNames[currentLanguage]}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-white/10 p-1 w-40">
        {i18nConfig.locales.map((lng) => (
          <DropdownMenuItem
            key={lng}
            className="rounded-lg h-9 text-[10px] font-bold uppercase tracking-widest cursor-pointer focus:bg-primary/10 focus:text-primary"
            onClick={() => handleLanguageChange(lng)}
          >
            {languageNames[lng]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
