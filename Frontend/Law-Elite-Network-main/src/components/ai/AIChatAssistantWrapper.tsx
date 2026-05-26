
"use client";

import React from 'react';
import dynamic from 'next/dynamic';

/**
 * @fileOverview AIChatAssistantWrapper
 * A Client Component designed specifically to handle the dynamic SSR-disabled loading
 * of the AI Chat Assistant. This ensures build-time compatibility with Server Layouts.
 */

const AIChatAssistant = dynamic(() => import('./AIChatAssistant'), { 
  ssr: false,
  loading: () => null 
});

export function AIChatAssistantWrapper() {
  return <AIChatAssistant />;
}
