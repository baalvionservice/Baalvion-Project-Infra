
"use client";

import { InternalLinkingService } from '../services/internal-linking.service';
import { ApiResponse } from '../types';

export class InternalLinkingController {
  constructor(private service: InternalLinkingService) {}

  async getProcessedContent(req: { content: string; slug: string }): Promise<ApiResponse> {
    try {
      const data = await this.service.generateInternalLinks(req.content, req.slug);
      return { success: true, message: 'Content optimized with internal links', data };
    } catch (error: any) {
      return { success: false, message: 'Optimization failure', error: error.message };
    }
  }

  async getRelated(article: any): Promise<ApiResponse> {
    try {
      const data = await this.service.getRelatedArticles(article);
      return { success: true, message: 'Related discovery fetched', data };
    } catch (error: any) {
      return { success: false, message: 'Fetch failed', error: error.message };
    }
  }
}
