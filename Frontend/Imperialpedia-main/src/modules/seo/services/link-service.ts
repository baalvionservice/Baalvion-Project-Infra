import { Article } from "@/modules/content-engine/types";
import { GlossaryTerm } from "../models/glossary-term";
import { Category } from "@/modules/content-engine/types/category";
import { Tag } from "@/modules/content-engine/types/tag";
import { articlesService, glossaryService } from "@/services/data";
import { getTags } from "@/modules/content-engine/services/tag-service";
import { getCategories } from "@/modules/content-engine/services/category-service";

/**
 * @fileOverview Centralized service for automating internal linking across the platform.
 * Orchestrates related content discovery and programmatic link injection.
 */

export const linkService = {
  /**
   * Automatically injects internal links into raw content based on the Glossary.
   * Rules: Max 5 links per article, unique targets only.
   */
  async autoLinkContent(html: string): Promise<string> {
    const glossaryRes = await glossaryService.getTerms(1, 500);
    const terms = glossaryRes.data;

    let linkedHtml = html;
    let linkCount = 0;
    const linkedSlugs = new Set<string>();

    // Sort terms by length (descending) to avoid partial matching issues
    const sortedTerms = [...terms].sort(
      (a, b) => b.term.length - a.term.length
    );

    for (const term of sortedTerms) {
      if (linkCount >= 5) break;
      if (linkedSlugs.has(term.slug)) continue;

      const regex = new RegExp(`\\b(${term.term})\\b`, "i");
      if (regex.test(linkedHtml)) {
        linkedHtml = linkedHtml.replace(
          regex,
          `<a href="/glossary/${term.slug}" class="text-primary hover:underline font-bold">${term.term}</a>`
        );
        linkedSlugs.add(term.slug);
        linkCount++;
      }
    }

    return linkedHtml;
  },

  /**
   * Fetches articles related to a specific article slug.
   */
  async getRelatedArticles(slug: string): Promise<Article[]> {
    const response = await articlesService.getArticles(1, 50);
    const current = response.data.find((a) => a.slug === slug);

    return response.data
      .filter(
        (a) => a.slug !== slug && (!current || a.category === current.category)
      )
      .slice(0, 3) as unknown as Article[];
  },

  /**
   * Fetches glossary terms related to a specific term slug.
   */
  async getRelatedGlossaryTerms(slug: string): Promise<GlossaryTerm[]> {
    const termResponse = await glossaryService.getTermBySlug(slug);
    const currentTerm = termResponse.data;

    const allTermsRes = await glossaryService.getTerms(1, 100);
    const allTerms = allTermsRes.data;

    return allTerms
      .filter(
        (t) =>
          t.slug !== slug &&
          (!currentTerm || t.category === currentTerm.category)
      )
      .slice(0, 4) as unknown as GlossaryTerm[];
  },

  /**
   * Fetches categories related to a specific category slug.
   */
  async getRelatedCategories(slug: string): Promise<Category[]> {
    const response = await getCategories();
    return response.data.filter((c) => c.slug !== slug).slice(0, 3);
  },

  /**
   * Fetches tags/topics related to a specific tag slug.
   */
  async getRelatedTags(slug: string): Promise<Tag[]> {
    const response = await getTags();
    return response.data.filter((t) => t.slug !== slug).slice(0, 6);
  },

  /**
   * Fetches related topic hubs for broad discovery.
   */
  async getRelatedTopics(slug: string): Promise<Tag[]> {
    return this.getRelatedTags(slug);
  },
};
