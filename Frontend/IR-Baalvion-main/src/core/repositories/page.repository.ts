'use client';

import { PageDefinition } from "../content/schemas";
import { StorageAdapter } from "../adapters/storage.adapter";
import { ApiResponse } from "@/types/api.types";
import { MOCK_PAGES } from "../providers/mock/mock-data";

export class PageRepository {
  private adapter: StorageAdapter;
  private initialized: boolean = false;

  constructor() {
    this.adapter = new StorageAdapter("pages");
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    await this.adapter.initialize(MOCK_PAGES);
    this.initialized = true;
  }

  async findBySlug(slug: string): Promise<ApiResponse<PageDefinition | null>> {
    await this.ensureInitialized();
    const response = await this.adapter.getAll<PageDefinition>();
    if (!response.success) return response as any;
    
    const page = response.data?.find(p => p.slug === slug) || null;
    return { ...response, data: page };
  }

  async findAll(): Promise<ApiResponse<PageDefinition[]>> {
    await this.ensureInitialized();
    return this.adapter.getAll<PageDefinition>();
  }

  async update(id: string, updates: Partial<PageDefinition>): Promise<ApiResponse<PageDefinition>> {
    await this.ensureInitialized();
    const response = await this.adapter.getAll<PageDefinition>();
    if (!response.success) return response as any;

    const data = response.data || [];
    const index = data.findIndex(p => p.id === id);
    if (index === -1) {
      return { 
        ...response, 
        success: false, 
        error: { code: 'ENTITY_NOT_FOUND', message: 'Page entry not located in registry.' } 
      } as any;
    }

    const updatedPage = { ...data[index], ...updates };
    data[index] = updatedPage;
    
    await this.adapter.saveAll(data);
    return { ...response, data: updatedPage };
  }
}

export const pageRepository = new PageRepository();
