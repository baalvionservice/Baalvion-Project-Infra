import { navigationService } from "./navigation.service";
import { pageService } from "./page.service";

export const validationService = {
  validateSlug: async (slug: string, excludeId?: string): Promise<{ valid: boolean; message?: string }> => {
    const pages = await pageService.getAllPages();
    const duplicate = pages.find(p => p.slug === slug && p.id !== excludeId);
    if (duplicate) {
      return { valid: false, message: 'Slug already in use by another page.' };
    }
    return { valid: true };
  },

  validateNavigation: async (): Promise<{ valid: boolean; errors: string[] }> => {
    const items = await navigationService.getAllItems();
    const errors: string[] = [];
    
    // Check for circular references (simplified for tree structure)
    const checkCycles = (nodes: any[], path: Set<string>) => {
      nodes.forEach(node => {
        if (path.has(node.id)) {
          errors.push(`Circular reference detected at: ${node.label}`);
          return;
        }
        if (node.children) {
          const nextPath = new Set(path);
          nextPath.add(node.id);
          checkCycles(node.children, nextPath);
        }
      });
    };

    checkCycles(items, new Set());
    return { valid: errors.length === 0, errors };
  }
};
