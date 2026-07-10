'use client';

import { useEffect } from 'react';
import { Sparkles, FileText, Tag, BarChart3, ShieldCheck, Languages } from 'lucide-react';
import { ComingSoonModule } from '@/components/news-intelligence/ComingSoonModule';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewsAiPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'AI' }]); }, [setBreadcrumbs]);

  return (
    <ComingSoonModule
      title="AI Pipeline"
      description="Draft generation, summarization, classification, and fact extraction for ingested articles"
      requiredService="an AI enrichment service (not built)"
      capabilities={[
        { icon: Sparkles, title: 'Draft Generation', description: 'Original AI-drafted articles from ingested source facts.' },
        { icon: FileText, title: 'Summarization', description: 'summary_ai on every article — the field already exists, unpopulated.' },
        { icon: Tag, title: 'Classification', description: 'Auto-tagging and category confidence scoring.' },
        { icon: ShieldCheck, title: 'Fact Extraction', description: 'Structured claims + entities pulled from source text.' },
        { icon: BarChart3, title: 'Content Scoring', description: 'Quality/originality score per draft before publish.' },
        { icon: Languages, title: 'Translation', description: 'Multi-language article variants.' },
      ]}
    />
  );
}
