import { Category } from '../types/category';

/**
 * @fileOverview Helper functions and constants for the Category model.
 */

export const createEmptyCategory = (): Partial<Category> => ({
  name: '',
  slug: '',
  description: '',
  articleCount: 0,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: [],
});

/**
 * Mock categories for the platform's initial taxonomy.
 */
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-economics',
    slug: 'economics',
    name: 'Economics',
    description: 'Deep dives into global macro trends, monetary policy, and fiscal analysis.',
    icon: 'TrendingUp',
    articleCount: 12,
    seoTitle: 'Economics Intelligence & Macro Trends',
    seoDescription: 'Master the principles of economics with our expert intelligence hubs.',
    seoKeywords: ['economics', 'macro', 'fiscal policy']
  },
  {
    id: 'cat-investing',
    slug: 'investing',
    name: 'Investing',
    description: 'Expert strategies for wealth building, asset allocation, and market analysis.',
    icon: 'PieChart',
    articleCount: 45,
    seoTitle: 'Investment Strategy & Wealth Management',
    seoDescription: 'Professional investment strategies for long-term capital growth.',
    seoKeywords: ['investing', 'wealth', 'stock market']
  },
  {
    id: 'cat-markets',
    slug: 'markets',
    name: 'Markets',
    description: 'Real-time analysis and historical context for equity, bond, and derivative markets.',
    icon: 'BarChart3',
    articleCount: 28,
    seoTitle: 'Financial Markets Analysis & Data',
    seoDescription: 'Deep analysis of global equity, bond, and currency markets.',
    seoKeywords: ['markets', 'stocks', 'bonds', 'forex']
  }
];
