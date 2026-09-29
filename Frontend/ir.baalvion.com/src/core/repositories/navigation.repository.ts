'use client';

import { NavigationItem } from "../content/schemas";
import { ApiResponse } from "@/types/api.types";

/**
 * Navigation registry — live, backed by the central Baalvion CMS (cms-service) via the
 * same-origin BFF route /api/cms/navigation. Replaces the former in-memory StorageAdapter/
 * MOCK_NAVIGATION. Editing happens in the admin-platform CMS console.
 */
export class NavigationRepository {
  async findAll(): Promise<ApiResponse<NavigationItem[]>> {
    try {
      const res = await fetch('/api/cms/navigation', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        return { success: false, data: [], error: json?.error || { code: 'CMS_UNAVAILABLE', message: 'Unable to reach the navigation registry.' } } as any;
      }
      return { success: true, data: (json.data || []) as NavigationItem[] } as ApiResponse<NavigationItem[]>;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unable to reach the navigation registry.';
      return { success: false, data: [], error: { code: 'CMS_UNAVAILABLE', message } } as any;
    }
  }

  async saveAll(_items: NavigationItem[]): Promise<ApiResponse<boolean>> {
    return {
      success: false,
      data: false,
      error: {
        code: 'MANAGED_EXTERNALLY',
        message: 'Navigation is managed centrally in the Baalvion CMS console (admin-platform). Edit it there.',
      },
    } as any;
  }
}

export const navigationRepository = new NavigationRepository();
