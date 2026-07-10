'use client';

import { useEffect } from 'react';
import { Search, LinkIcon, FileWarning, Map, Code2, Copy } from 'lucide-react';
import { ComingSoonModule } from '@/components/news-intelligence/ComingSoonModule';
import { useUIStore } from '@/lib/store/uiStore';

export default function NewsSeoPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence', href: '/news-intelligence' }, { label: 'SEO' }]); }, [setBreadcrumbs]);

  return (
    <ComingSoonModule
      title="SEO Audit"
      description="Meta/schema audits, sitemap health, and canonical/duplicate detection across articles"
      requiredService="an SEO audit engine (not built)"
      capabilities={[
        { icon: FileWarning, title: 'Missing Meta', description: 'Articles missing title/description/OG tags.' },
        { icon: LinkIcon, title: 'Broken Links', description: 'Outbound + internal link health across published articles.' },
        { icon: Copy, title: 'Duplicate Titles', description: 'Near-duplicate title/content detection.' },
        { icon: Code2, title: 'Schema Errors', description: 'NewsArticle / Organization structured-data validation.' },
        { icon: Map, title: 'Sitemap Status', description: 'Sitemap freshness and submission status per source.' },
        { icon: Search, title: 'Canonical Errors', description: 'Cross-source canonical URL conflicts.' },
      ]}
    />
  );
}
