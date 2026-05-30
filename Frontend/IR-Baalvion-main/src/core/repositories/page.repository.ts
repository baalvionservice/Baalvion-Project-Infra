'use client';

import { PageDefinition } from "../content/schemas";
import { ApiResponse } from "@/types/api.types";

/**
 * Page registry — live, backed by the central Baalvion CMS (cms-service) via the same-origin
 * BFF route /api/cms/pages. Replaces the former in-memory StorageAdapter/MOCK_PAGES.
 * Authoritative page editing happens in the admin-platform CMS console, so writes here are
 * intentionally disabled (the local admin surfaces deep-link to the console).
 */
async function fetchPages(): Promise<ApiResponse<PageDefinition[]>> {
  try {
    const res = await fetch('/api/cms/pages', { cache: 'no-store' });
    const json = await res.json();
    if (!res.ok || !json?.success) {
      return { success: false, data: [], error: json?.error || { code: 'CMS_UNAVAILABLE', message: 'Unable to reach the content registry.' } } as any;
    }
    return { success: true, data: (json.data || []) as PageDefinition[] } as ApiResponse<PageDefinition[]>;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unable to reach the content registry.';
    return { success: false, data: [], error: { code: 'CMS_UNAVAILABLE', message } } as any;
  }
}

export class PageRepository {
  async findBySlug(slug: string): Promise<ApiResponse<PageDefinition | null>> {
    const response = await fetchPages();
    if (!response.success) return response as any;
    const page = (response.data || []).find(p => p.slug === slug) || null;
    return { success: true, data: page } as ApiResponse<PageDefinition | null>;
  }

  async findAll(): Promise<ApiResponse<PageDefinition[]>> {
    return fetchPages();
  }

  async update(_id: string, _updates: Partial<PageDefinition>): Promise<ApiResponse<PageDefinition>> {
    return {
      success: false,
      data: null,
      error: {
        code: 'MANAGED_EXTERNALLY',
        message: 'Page content is managed centrally in the Baalvion CMS console (admin-platform). Edit it there.',
      },
    } as any;
  }
}

export const pageRepository = new PageRepository();
