"use client";

import { useAppStore } from "@/lib/store";
import {
  AIModuleStatus,
  AIActionLog,
  AISuggestion,
  AIAutomationLevel,
  PrivateInquiry,
  WorkflowTask,
} from "@/lib/types";
import {
  generateAIReply,
  detectIntent,
} from "@/lib/ai-autopilot/ai-sales-agent";
import {
  generateAIProductDraft,
  generateAIBlogDraft,
} from "@/lib/ai-autopilot/ai-content-engine";
import {
  generateAIMetadata,
  auditPageSEO,
} from "@/lib/ai-autopilot/ai-seo-optimizer";
import { analyzeLeadQuality } from "@/lib/ai-autopilot/ai-analytics-engine";

export function useAI() {
  const {
    aiModules,
    aiLogs,
    aiSuggestions,
    scopedWorkflows,
    updateAIModule,
    addAILog,
    upsertAISuggestion,
    updateSuggestionStatus,
    runWorkflowTask,
    runWorkflowSequence,
  } = useAppStore();

  const getModule = (id: string) => aiModules.find((m) => m.id === id);
  const isModuleActive = (id: string) => getModule(id)?.enabled ?? false;

  const logAction = (
    moduleId: string,
    action: string,
    details: string,
    status: AIActionLog["status"] = "executed"
  ) => {
    addAILog({
      id: `ai-log-${Date.now()}`,
      moduleId,
      action,
      details,
      status,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    modules: aiModules,
    logs: aiLogs,
    suggestions: aiSuggestions,
    jobs: scopedWorkflows,
    updateModule: updateAIModule,
    approveSuggestion: (id: string) => updateSuggestionStatus(id, "approved"),
    rejectSuggestion: (id: string) => updateSuggestionStatus(id, "rejected"),
    runJob: runWorkflowTask,
    runSequence: runWorkflowSequence,
    logAction,
    isModuleActive,
    upsertAISuggestion,
  };
}

export function useAISales() {
  const { messagingTemplates } = useAppStore();
  const { logAction, isModuleActive } = useAI();

  const getDraftReply = (inquiry: PrivateInquiry) => {
    if (!isModuleActive("ai-sales")) return null;
    const reply = generateAIReply(inquiry, messagingTemplates);
    logAction(
      "ai-sales",
      "Drafted Curatorial Response",
      `For ${inquiry.customerName}`,
      "suggested"
    );
    return reply;
  };

  return { getDraftReply, detectIntent };
}

export function useAIContent() {
  const { logAction, isModuleActive, upsertAISuggestion } = useAI();

  const draftProductNarration = (product: any) => {
    if (!isModuleActive("ai-content")) return;
    const draft = generateAIProductDraft(product);
    upsertAISuggestion({
      id: `sug-${Date.now()}`,
      moduleId: "ai-content",
      type: "content",
      title: `Narrative for ${product.name}`,
      description: `AI generated curatorial study based on product metadata.`,
      data: draft,
      status: "pending",
      timestamp: new Date().toISOString(),
    });
    logAction(
      "ai-content",
      "Generated Product Draft",
      product.name,
      "suggested"
    );
  };

  return { draftProductNarration, generateAIBlogDraft };
}

export function useAISEO() {
  const { logAction, isModuleActive } = useAI();

  const optimizeMetadata = (title: string, country: string) => {
    if (!isModuleActive("ai-seo")) return null;
    const meta = generateAIMetadata(title, country);
    logAction("ai-seo", "Suggested Meta Tags", title);
    return meta;
  };

  return { optimizeMetadata, auditPageSEO };
}

export function useAIAnalytics() {
  const { privateInquiries } = useAppStore();
  const { logAction, isModuleActive } = useAI();

  const getStrategicInsight = () => {
    if (!isModuleActive("ai-analytics")) return null;
    const insight = analyzeLeadQuality(privateInquiries);
    logAction("ai-analytics", "Strategic Market Insight", "Inquiry Analysis");
    return insight;
  };

  return { getStrategicInsight };
}
