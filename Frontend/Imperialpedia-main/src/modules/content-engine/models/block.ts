import { ContentBlock, BlockType } from '../types/block';

/**
 * @fileOverview Helper functions for Content Block models.
 */

export const createNewBlock = (type: BlockType, content: any = ''): ContentBlock => ({
  id: crypto.randomUUID(),
  type,
  content,
});
