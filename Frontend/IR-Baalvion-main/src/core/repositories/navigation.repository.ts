'use client';

import { NavigationItem } from "../content/schemas";
import { StorageAdapter } from "../adapters/storage.adapter";
import { ApiResponse } from "@/types/api.types";
import { MOCK_NAVIGATION } from "../providers/mock/mock-data";

export class NavigationRepository {
  private adapter: StorageAdapter;

  constructor() {
    this.adapter = new StorageAdapter("navigation");
    this.init();
  }

  private async init() {
    await this.adapter.initialize(MOCK_NAVIGATION);
  }

  async findAll(): Promise<ApiResponse<NavigationItem[]>> {
    return this.adapter.getAll<NavigationItem>();
  }

  async saveAll(items: NavigationItem[]): Promise<ApiResponse<boolean>> {
    return this.adapter.saveAll(items);
  }
}

export const navigationRepository = new NavigationRepository();
