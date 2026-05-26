'use client';

import React, { ReactNode } from 'react';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions } from '@/i18n/config';

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string, namespace: string) => import(`@/i18n/locales/${language}/${namespace}.json`)))
  .init({
    ...getOptions(),
    detection: {
      order: ['path', 'htmlTag', 'cookie', 'navigator'],
    },
  });

/**
 * @fileOverview Global I18n Provider for the platform.
 * 
 * // TODO: AI-driven automatic translation suggestions per user region
 * // TODO: Personalized content based on preferred language
 * // TODO: Analytics tracking for language switch interactions
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
