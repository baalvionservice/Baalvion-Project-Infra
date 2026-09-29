
"use client";

export interface KeywordMapping {
  id: string;
  keyword: string;
  targetSlug: string;
  priorityScore: number;
  categoryContext?: string;
}

export class KeywordMappingRepository {
  constructor() {}

  async getAll(): Promise<KeywordMapping[]> {
    return [];
  }

  async save(mapping: Omit<KeywordMapping, 'id'> & { id?: string }) {
    return { ...mapping, id: mapping.id ?? '', priorityScore: mapping.priorityScore || 0 } as KeywordMapping;
  }

  async delete(_id: string) {
    // no-op stub
  }
}
