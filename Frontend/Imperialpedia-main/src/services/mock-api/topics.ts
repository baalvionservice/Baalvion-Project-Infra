import { ApiResponse } from '@/types';
import { GlobalTopicIndexData, TopicNode } from '@/types/topics';

/**
 * @fileOverview Mock service for the Global Topic Index.
 */

const mockTopics: TopicNode[] = [
  { id: 't1', title: 'Asset Allocation', slug: 'asset-allocation', definition: 'The implementation of an investment strategy that aims to balance risk and reward.', category: 'Investing', difficulty: 'Beginner', reading_time: '5 minutes', popularity_score: 92, type: 'Guide' },
  { id: 't2', title: 'Arbitrage', slug: 'arbitrage', definition: 'The simultaneous purchase and sale of an asset to profit from an imbalance in the price.', category: 'Trading', difficulty: 'Advanced', reading_time: '8 minutes', popularity_score: 75, type: 'Article' },
  { id: 't3', title: 'Annual Percentage Yield', slug: 'apy', definition: 'The real rate of return earned on an investment, taking into account the effect of compounding interest.', category: 'Banking', difficulty: 'Beginner', reading_time: '4 minutes', popularity_score: 88, type: 'Article' },
  { id: 't4', title: 'Bond Market', slug: 'bond-market', definition: 'A financial market where participants can issue new debt, known as the primary market, or buy and sell debt securities.', category: 'Markets', difficulty: 'Intermediate', reading_time: '10 minutes', popularity_score: 82, type: 'Article' },
  { id: 't5', title: 'Bitcoin', slug: 'bitcoin', definition: 'A decentralized digital currency without a central bank or single administrator.', category: 'Cryptocurrency', difficulty: 'Beginner', reading_time: '6 minutes', popularity_score: 98, type: 'Guide' },
  { id: 't6', title: 'Balance Sheet', slug: 'balance-sheet', definition: 'A financial statement that reports a company\'s assets, liabilities, and shareholder equity.', category: 'Finance', difficulty: 'Intermediate', reading_time: '12 minutes', popularity_score: 70, type: 'Article' },
  { id: 't7', title: 'Compound Interest', slug: 'compound-interest', definition: 'Interest calculated on the principal amount and the accumulated interest of previous periods.', category: 'Investing', difficulty: 'Beginner', reading_time: '5 minutes', popularity_score: 95, type: 'Guide' },
  { id: 't8', title: 'Dividend Yield', slug: 'dividend-yield', definition: 'A financial ratio that shows how much a company pays out in dividends each year relative to its stock price.', category: 'Stock Market', difficulty: 'Beginner', reading_time: '4 minutes', popularity_score: 89, type: 'Article' },
  { id: 't9', title: 'Exchange Traded Fund (ETF)', slug: 'etf', definition: 'A type of pooled investment security that operates much like a mutual fund.', category: 'Investing', difficulty: 'Beginner', reading_time: '7 minutes', popularity_score: 91, type: 'Article' },
  { id: 't10', title: 'Federal Reserve', slug: 'federal-reserve', definition: 'The central banking system of the United States.', category: 'Macroeconomics', difficulty: 'Intermediate', reading_time: '15 minutes', popularity_score: 94, type: 'Article' },
  { id: 't11', title: 'GDP (Gross Domestic Product)', slug: 'gdp', definition: 'The total monetary or market value of all the finished goods and services produced within a country.', category: 'Macroeconomics', difficulty: 'Intermediate', reading_time: '8 minutes', popularity_score: 85, type: 'Article' },
  { id: 't12', title: 'Inflation', slug: 'inflation', definition: 'The rate at which the general level of prices for goods and services is rising.', category: 'Macroeconomics', difficulty: 'Beginner', reading_time: '6 minutes', popularity_score: 97, type: 'Article' },
  { id: 't13', title: 'Market Capitalization', slug: 'market-cap', definition: 'The total dollar market value of a company\'s outstanding shares of stock.', category: 'Stock Market', difficulty: 'Beginner', reading_time: '5 minutes', popularity_score: 90, type: 'Article' },
  { id: 't14', title: 'Quantitative Easing', slug: 'qe', definition: 'A form of monetary policy in which a central bank purchases at-scale government bonds.', category: 'Macroeconomics', difficulty: 'Advanced', reading_time: '12 minutes', popularity_score: 84, type: 'Article' },
  { id: 't15', title: 'Recession', slug: 'recession', definition: 'A significant decline in economic activity spread across the economy, lasting more than a few months.', category: 'Macroeconomics', difficulty: 'Intermediate', reading_time: '10 minutes', popularity_score: 93, type: 'Article' },
];

const mockIndexData: GlobalTopicIndexData = {
  topics: mockTopics,
  trending_topics: ["Inflation", "Interest Rates", "Bitcoin ETF", "Recession", "AI Infrastructure", "Yield Curves"],
  learning_paths: [
    {
      id: 'path-1',
      name: 'Beginner Investor Path',
      description: 'The foundational roadmap for building long-term wealth through simple, effective strategies.',
      topics: [
        { title: 'What is a Stock', slug: 'stocks' },
        { title: 'How Stock Markets Work', slug: 'markets' },
        { title: 'Diversification', slug: 'diversification' },
        { title: 'Risk Management', slug: 'risk' }
      ]
    },
    {
      id: 'path-2',
      name: 'Crypto Beginner Path',
      description: 'A technical and fundamental introduction to the decentralized finance landscape.',
      topics: [
        { title: 'What is Bitcoin', slug: 'bitcoin' },
        { title: 'Blockchain Basics', slug: 'blockchain' },
        { title: 'Crypto Wallets', slug: 'wallets' },
        { title: 'Crypto Exchanges', slug: 'exchanges' }
      ]
    }
  ],
  categories: [
    { name: 'Macroeconomics', count: 124 },
    { name: 'Stock Market', count: 420 },
    { name: 'Cryptocurrency', count: 350 },
    { name: 'Personal Finance', count: 210 },
    { name: 'Trading', count: 185 },
    { name: 'Banking', count: 94 },
    { name: 'Investing', count: 560 },
    { name: 'Financial Instruments', count: 112 }
  ]
};

export const getGlobalTopicIndex = async (): Promise<ApiResponse<GlobalTopicIndexData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockIndexData,
    status: 200,
  };
};
