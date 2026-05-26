import { ApiResponse } from '@/types';
import { KnowledgeGraphData } from '@/types/knowledge-graph';

/**
 * @fileOverview Mock service for the Knowledge Graph Engine data.
 */

const mockGraphData: KnowledgeGraphData = {
  nodes: [
    {
      id: "inflation",
      label: "Inflation",
      type: "concept",
      category: "Macroeconomics",
      description: "The rate at which the general level of prices for goods and services is rising and, subsequently, purchasing power is falling.",
      metrics: { articles: 124, concepts: 12, experts: 15 },
      tags: ["CPI", "PPI", "Macro"]
    },
    {
      id: "interest_rates",
      label: "Interest Rates",
      type: "concept",
      category: "Macroeconomics",
      description: "The amount a lender charges for the use of assets expressed as a percentage of the principal.",
      metrics: { articles: 85, concepts: 8, experts: 12 },
      tags: ["Yield", "Fed", "Bonds"]
    },
    {
      id: "federal_reserve",
      label: "Federal Reserve",
      type: "institution",
      category: "Macroeconomics",
      description: "The central banking system of the United States, responsible for conducting national monetary policy.",
      metrics: { articles: 240, concepts: 15, experts: 22 },
      tags: ["Central Bank", "Monetary Policy", "USD"]
    },
    {
      id: "monetary_policy",
      label: "Monetary Policy",
      type: "concept",
      category: "Macroeconomics",
      description: "The set of tools used by a nation's central bank to control the overall money supply and promote economic growth.",
      metrics: { articles: 92, concepts: 6, experts: 10 },
      tags: ["QE", "QT", "Rates"]
    },
    {
      id: "bitcoin",
      label: "Bitcoin",
      type: "asset",
      category: "Cryptocurrency",
      description: "A decentralized digital currency without a central bank or single administrator that can be sent from user to user on the peer-to-peer bitcoin network.",
      metrics: { articles: 450, concepts: 24, experts: 35 },
      tags: ["BTC", "Store of Value", "Digital Gold"]
    },
    {
      id: "cryptocurrency_market",
      label: "Crypto Market",
      type: "market",
      category: "Cryptocurrency",
      description: "The global ecosystem where digital assets are traded, characterized by high volatility and decentralized infrastructure.",
      metrics: { articles: 1200, concepts: 45, experts: 85 },
      tags: ["Web3", "Blockchain", "Digital Assets"]
    },
    {
      id: "stock_market",
      label: "Stock Market",
      type: "market",
      category: "Stock Market",
      description: "The aggregation of buyers and sellers of stocks, representing ownership claims on businesses.",
      metrics: { articles: 3500, concepts: 120, experts: 156 },
      tags: ["Equities", "Indices", "S&P 500"]
    },
    {
      id: "valuation",
      label: "Valuation",
      type: "concept",
      category: "Stock Market",
      description: "The process of determining the current worth of an asset or company.",
      metrics: { articles: 156, concepts: 14, experts: 18 },
      tags: ["P/E Ratio", "DCF", "Alpha"]
    },
    {
      id: "yield_curve",
      label: "Yield Curve",
      type: "indicator",
      category: "Macroeconomics",
      description: "A line that plots yields (interest rates) of bonds having equal credit quality but differing maturity dates.",
      metrics: { articles: 42, concepts: 5, experts: 8 },
      tags: ["Bonds", "Inversion", "Recession"]
    }
  ],
  connections: [
    { source: "inflation", target: "interest_rates", label: "Influences" },
    { source: "interest_rates", target: "federal_reserve", label: "Managed By" },
    { source: "federal_reserve", target: "monetary_policy", label: "Determines" },
    { source: "bitcoin", target: "cryptocurrency_market", label: "Primary Asset" },
    { source: "stock_market", target: "interest_rates", label: "Inverse Correlation" },
    { source: "valuation", target: "stock_market", label: "Core Metric" },
    { source: "yield_curve", target: "interest_rates", label: "Visualizes" },
    { source: "yield_curve", target: "inflation", label: "Predicts" },
    { source: "monetary_policy", target: "inflation", label: "Targets" }
  ]
};

export const getKnowledgeGraphData = async (): Promise<ApiResponse<KnowledgeGraphData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockGraphData,
    status: 200,
  };
};
