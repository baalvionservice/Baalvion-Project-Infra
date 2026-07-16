/**
 * @fileOverview Type definitions for the Financial Knowledge Graph Engine.
 *
 * Nodes map 1:1 to real Imperialpedia knowledge entities (company/country/industry/
 * technology, from `@/lib/data/loaders`); connections are derived from each entity's own
 * real cross-reference fields (competitors, technologies, industry, country, etc. — the
 * same fields `getRelatedEntities` in loaders.ts already resolves for the entity detail
 * pages). `category` is intentionally a free string: real entity categories aren't a
 * fixed finance-topic taxonomy.
 */

export type NodeType = 'company' | 'country' | 'industry' | 'technology';
export type NodeCategory = string;

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  category: NodeCategory;
  description: string;
  /** Real, computed counts — not live analytics. `relations` is the number of graph
   * edges touching this node; `tags` is the entity's own real tag count. */
  metrics: {
    relations: number;
    tags: number;
  };
  tags: string[];
  /** Real slug on the entity's own detail page, e.g. /companies/{slug}. */
  slug: string;
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
