import { ContentSection } from '../types/section';

/**
 * @fileOverview Helper functions for Section models.
 */

export const createNewSection = (order: number, title?: string): ContentSection => ({
  id: crypto.randomUUID(),
  title,
  order,
  blocks: [],
});
