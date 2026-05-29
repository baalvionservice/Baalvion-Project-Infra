"use client";
// Docs content (API reference, help articles, FAQ) from the live dashboardApi.docs() endpoint.
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface ApiParam { name: string; type: string; required: boolean; description: string }
export interface ApiEndpoint { method: string; path: string; description: string; parameters: ApiParam[]; request: string; response: string }
export interface ApiCategory { name: string; endpoints: ApiEndpoint[] }
export interface HelpCategory { slug: string; name: string; description: string }
export interface HelpArticle { slug: string; title: string; category: string; readingTime: string; lastUpdated: string; content: string }
export interface FaqItem { question: string; answer: string }
export interface DocsData {
  apiDocs: { categories: ApiCategory[] };
  helpArticles: { categories: HelpCategory[]; articles: HelpArticle[] };
  faq: FaqItem[];
}

const EMPTY: DocsData = { apiDocs: { categories: [] }, helpArticles: { categories: [], articles: [] }, faq: [] };

export function useDocs() {
  const [data, setData] = useState<DocsData>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.docs();
        const obj = ((d as { data?: unknown })?.data ?? d) as DocsData;
        if (!cancelled && obj) setData({ ...EMPTY, ...obj });
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return data;
}
