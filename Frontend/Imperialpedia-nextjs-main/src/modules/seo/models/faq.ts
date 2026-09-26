import { ID } from '@/types/common';

/**
 * @fileOverview Data model for Frequently Asked Questions used in pSEO schema.
 */
export interface FAQ {
  id: ID;
  question: string;
  answer: string;
}
