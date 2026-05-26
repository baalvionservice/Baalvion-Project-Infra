
'use client';

import { useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { PrivateInquiry, LeadConversation, SalesScript } from '@/lib/types';
import { ACQUISITION_SCRIPTS } from '@/lib/mock-sales-system';

export function useSalesSystem() {
  const { 
    privateInquiries, 
    leadConversations, 
    addLeadMessage, 
    updateInquiryStatus,
    upsertPrivateInquiry 
  } = useAppStore();

  const getInquiry = useCallback((id: string) => {
    return privateInquiries.find(i => i.id === id);
  }, [privateInquiries]);

  const getConversation = useCallback((inquiryId: string) => {
    return leadConversations.find(c => c.inquiryId === inquiryId);
  }, [leadConversations]);

  const triggerAutoReply = useCallback((inquiryId: string, userMessage: string) => {
    const inquiry = privateInquiries.find(i => i.id === inquiryId);
    if (!inquiry) return;

    // Simulate curator thinking time
    setTimeout(() => {
      let script: SalesScript | undefined;
      const lowerMsg = userMessage.toLowerCase();

      // Simple keyword matching for "Mock AI"
      if (inquiry.status === 'new') {
        script = ACQUISITION_SCRIPTS.find(s => s.stage === 'new');
        updateInquiryStatus(inquiryId, 'contacted');
      } else if (lowerMsg.includes('investment') || lowerMsg.includes('market')) {
        script = ACQUISITION_SCRIPTS.find(s => s.id === 'script-investor');
        updateInquiryStatus(inquiryId, 'qualifying');
      } else if (lowerMsg.includes('personal') || lowerMsg.includes('gift')) {
        script = ACQUISITION_SCRIPTS.find(s => s.id === 'script-personal');
        updateInquiryStatus(inquiryId, 'qualifying');
      } else if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
        script = ACQUISITION_SCRIPTS.find(s => s.id === 'script-price');
        updateInquiryStatus(inquiryId, 'presenting');
      } else if (lowerMsg.includes('wait') || lowerMsg.includes('available')) {
        script = ACQUISITION_SCRIPTS.find(s => s.id === 'script-scarcity');
        updateInquiryStatus(inquiryId, 'closing');
      }

      if (script) {
        addLeadMessage(inquiryId, script.template, 'curator');
      }
    }, 1500);
  }, [privateInquiries, addLeadMessage, updateInquiryStatus]);

  const sendClientMessage = useCallback((inquiryId: string, text: string) => {
    addLeadMessage(inquiryId, text, 'client');
    triggerAutoReply(inquiryId, text);
  }, [addLeadMessage, triggerAutoReply]);

  const createInitialInquiry = useCallback((data: Omit<PrivateInquiry, 'id' | 'status' | 'leadTier' | 'timestamp'>) => {
    const id = `inq-${Date.now()}`;
    const inquiry: PrivateInquiry = {
      ...data,
      id,
      status: 'new',
      leadTier: 3, // Logic handled in store
      timestamp: new Date().toISOString()
    };
    upsertPrivateInquiry(inquiry);
    
    // Immediate first reply logic
    setTimeout(() => {
      const script = ACQUISITION_SCRIPTS.find(s => s.stage === 'new');
      if (script) {
        addLeadMessage(id, script.template, 'curator');
        updateInquiryStatus(id, 'contacted');
      }
    }, 1000);

    return id;
  }, [upsertPrivateInquiry, addLeadMessage, updateInquiryStatus]);

  return {
    getInquiry,
    getConversation,
    sendClientMessage,
    createInitialInquiry
  };
}
