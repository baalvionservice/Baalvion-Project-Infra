import { Tag } from '../types/tag';

/**
 * @fileOverview Helper functions and constants for the Tag model.
 */

export const MOCK_TAGS: Tag[] = [
  { 
    id: 'tag-macro', 
    slug: 'macro', 
    name: 'Macroeconomics', 
    description: 'Broad economic trends, global indicators, and structural analysis.', 
    articleCount: 15,
    seoTitle: 'Macroeconomics Intelligence Index',
    seoDescription: 'Explore deep insights into global macro trends and structural economic analysis.',
    seoKeywords: ['macro', 'global economy', 'indicators']
  },
  { 
    id: 'tag-ir', 
    slug: 'interest-rates', 
    name: 'Interest Rates', 
    description: 'Central bank policies, yield movements, and market lending rates.', 
    articleCount: 8,
    seoTitle: 'Interest Rate Analysis & Central Bank Policy',
    seoDescription: 'Track how interest rates impact global financial markets.',
    seoKeywords: ['interest rates', 'fed', 'yield curve']
  },
  { 
    id: 'tag-recession', 
    slug: 'recession', 
    name: 'Recession', 
    description: 'Economic downturn analysis, historical cycles, and recovery signals.', 
    articleCount: 4,
    seoTitle: 'Recession Indicators & Historical Analysis',
    seoDescription: 'Understanding the signals and impacts of economic recessions.',
    seoKeywords: ['recession', 'bear market', 'economic cycle']
  }
];
