import { ID } from '@/types/common';
import { ContentBlock } from './block';

/**
 * @fileOverview Structure for article sections containing multiple content blocks.
 */

export interface ContentSection {
  id: ID;
  title?: string;
  order: number;
  blocks: ContentBlock[];
}
