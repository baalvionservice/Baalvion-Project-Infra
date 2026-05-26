'use client';

import { useAppStore } from '@/lib/store';
import { AutomationRule } from '@/lib/types';

export function useAutomation() {
  const { automationRules, toggleRule, upsertRule } = useAppStore();

  return {
    rules: automationRules,
    toggleRule,
    updateRule: upsertRule
  };
}
