'use client';

import { useAppStore } from '@/lib/store';
import { SalesScript } from '@/lib/types';

export function useMessaging() {
  const { messagingTemplates, upsertTemplate } = useAppStore();

  const getTemplateByStage = (stage: string) => {
    return messagingTemplates.find(t => t.stage === stage);
  };

  return {
    templates: messagingTemplates,
    getTemplateByStage,
    updateTemplate: upsertTemplate
  };
}
