import { ID } from '@/types/common';

/**
 * @fileOverview Definitions for content blocks that compose an article section.
 */

export type BlockType = 
  | 'paragraph' 
  | 'heading' 
  | 'list' 
  | 'quote' 
  | 'image' 
  | 'table'
  | 'callout';

export interface ContentBlock {
  id: ID;
  type: BlockType;
  content: any; // Can be string for text, array for lists, or object for images/tables
  metadata?: {
    level?: 1 | 2 | 3 | 4 | 5 | 6; // For headings
    caption?: string; // For images/quotes
    altText?: string; // For images
    variant?: 'info' | 'warning' | 'error' | 'success'; // For callouts
    isOrdered?: boolean; // For lists
  };
}
