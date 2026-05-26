"use client";

import { useEffect, useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { Locale } from "@/utils/i18n";

export function LanguageSelector() {
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('baalvion_locale') as Locale;
    if (saved) setCurrentLocale(saved);
  }, []);

  const handleLocaleChange = (locale: Locale) => {
    setCurrentLocale(locale);
    localStorage.setItem('baalvion_locale', locale);
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
    // Force immediate UI update for localization
    window.location.reload(); 
  };

  const languages = [
    { code: 'en', label: 'English (US)' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Globe className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code as Locale)}
            className={currentLocale === lang.code ? "font-bold bg-primary/10" : ""}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
