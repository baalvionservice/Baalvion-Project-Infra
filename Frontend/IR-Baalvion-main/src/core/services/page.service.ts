'use client';

import { PageDefinition, WorkflowStatus } from "../content/schemas";
import { pageRepository } from "../repositories/page.repository";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { ApiResponse } from "@/types/api.types";

export const pageService = {
  getPageBySlug: async (slug: string): Promise<ApiResponse<PageDefinition | null>> => {
    // Ensure sequential initialization to prevent racing
    const { role } = await authService.getCurrentUser();
    const response = await pageRepository.findBySlug(slug);

    if (response.success && response.data) {
      const page = response.data;
      console.log(page)
      
      // Strict role-based section filtration logic
      const filteredSections = page.sections
        .filter(s => s.isActive && authService.hasAccess(s.roles, role))
        .sort((a, b) => a.order - b.order);

      const filteredPage: PageDefinition = {
        ...page,
        sections: filteredSections
      };

      return { 
        ...response, 
        data: filteredSections.length > 0 ? filteredPage : null 
      };
    }

    return response;
  },

  getAllPages: async (): Promise<ApiResponse<PageDefinition[]>> => {
    return pageRepository.findAll();
  },

  updatePage: async (pageId: string, updates: Partial<PageDefinition>): Promise<ApiResponse<PageDefinition>> => {
    const { role } = await authService.getCurrentUser();
    
    const response = await pageRepository.update(pageId, {
      ...updates,
      workflowStatus: 'Draft' as WorkflowStatus
    });

    if (response.success && response.data) {
      await auditService.log({
        userRole: role,
        module: 'Pages',
        action: 'edit',
        entityId: pageId,
        newState: updates
      });
      window.dispatchEvent(new CustomEvent('storage'));
    }

    return response;
  },

  approvePage: async (pageId: string): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const response = await pageRepository.findAll();
    const pages = response.data || [];
    const page = pages.find(p => p.id === pageId);
    
    if (!page) return;

    const updatedVersion = (page.currentVersion || 0) + 1;
    const updates: Partial<PageDefinition> = {
      workflowStatus: 'Published' as WorkflowStatus,
      status: 'Published' as 'Published',
      currentVersion: updatedVersion,
      versionHistory: [
        ...(page.versionHistory || []),
        { 
          version: updatedVersion, 
          author: role, 
          timestamp: new Date().toISOString() 
        }
      ]
    };

    await pageRepository.update(pageId, updates);
    window.dispatchEvent(new CustomEvent('storage'));
  }
};
