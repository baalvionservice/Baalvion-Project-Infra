"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar' | 'zh' | 'es' | 'fr' | 'pt' | 'bn';

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const TRANSLATIONS: Translations = {
  education: {
    en: 'Education',
    ar: 'التعليم',
    zh: '教育',
    es: 'Educación',
    fr: 'Éducation',
    pt: 'Educação',
    bn: 'শিক্ষা'
  },
  marketplace: {
    en: 'Marketplace',
    ar: 'السوق',
    zh: '市场',
    es: 'Mercado',
    fr: 'Marché',
    pt: 'Mercado',
    bn: 'বাজার'
  },
  forums: {
    en: 'Forums',
    ar: 'المنتديات',
    zh: '论坛',
    es: 'Foros',
    fr: 'Forums',
    pt: 'Fóruns',
    bn: 'ফোরাম'
  },
  book_now: {
    en: 'Book Now',
    ar: 'احجز الآن',
    zh: '立即预订',
    es: 'Reservar',
    fr: 'Réserver',
    pt: 'Reservar',
    bn: 'এখনই বুক করুন'
  },
  good_morning: {
    en: 'Good Morning',
    ar: 'صباح الخير',
    zh: '早上好',
    es: 'Buenos días',
    fr: 'Bonjour',
    pt: 'Bom dia',
    bn: 'শুভ সকাল'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    setDir(language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return TRANSLATIONS[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
