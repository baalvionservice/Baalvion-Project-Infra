
"use client";

import { KeywordMappingRepository } from '../repositories/keyword-mapping.repository';

export class InternalLinkingService {
  constructor(private mappingRepo: KeywordMappingRepository) {}

  async generateInternalLinks(content: string, currentSlug: string): Promise<string> {
    const mappings = await this.mappingRepo.getAll();
    let processedContent = content;
    let linkCount = 0;
    const MAX_LINKS = 8;
    const linkedSlugs = new Set([currentSlug]);

    const sortedMappings = [...mappings].sort((a, b) => b.keyword.length - a.keyword.length);

    for (const mapping of sortedMappings) {
      if (linkCount >= MAX_LINKS) break;
      if (linkedSlugs.has(mapping.targetSlug)) continue;

      const escapedKeyword = mapping.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<!<a[^>]*>|h[1-3][^>]*>)\\b(${escapedKeyword})\\b(?![^<]*<\\/a>|[^<]*<\\/h[1-3]>)`, 'i');

      if (regex.test(processedContent)) {
        processedContent = processedContent.replace(regex, `<a href="/article/${mapping.targetSlug}" class="text-blue-600 underline decoration-blue-200 decoration-2 underline-offset-4 hover:decoration-blue-600 transition-all font-bold">${mapping.keyword}</a>`);
        linkedSlugs.add(mapping.targetSlug);
        linkCount++;
      }
    }

    return processedContent;
  }

  async getRelatedArticles(_article: unknown, _maxResults: number = 8): Promise<unknown[]> {
    return [];
  }
}
