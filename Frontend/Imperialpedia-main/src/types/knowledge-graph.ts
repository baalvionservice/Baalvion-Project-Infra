/**
 * @fileOverview Type definitions for the Financial Knowledge Graph Engine.
 */

export type NodeType = 'concept' | 'asset' | 'article' | 'institution' | 'market' | 'indicator';
export type NodeCategory = 'Macroeconomics' | 'Stock Market' | 'Cryptocurrency' | 'Personal Finance' | 'Trading';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  category: NodeCategory;
  description: string;
  metrics: {
    articles: number;
    concepts: number;
    experts: number;
  };
  tags: string[];
}

export interface GraphConnection {
  source: string;
  target: string;
  label?: string;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  connections: GraphConnection[];
}

export interface NodeSelectionState {
  selectedNodeId: string | null;
  highlightedIds: string[];
}
