/**
 * @file server/gckb/knowledge-graph.ts
 * @description MODULE 7 — Knowledge Graph: a tenant-scoped traversal service over
 * the typed edges already produced by every registry (organizations, products,
 * HS codes, certificates, countries, documents, workflows, authorities, ports,
 * policies, rules). It does NOT introduce a parallel graph store — the graph IS
 * the `gckb_records` + `gckb_relationships` the other modules already write. The
 * service offers neighbour lookup, bounded breadth-first traversal (a subgraph)
 * and shortest-path search, all read-only and deterministic.
 */
import { GckbRecord, GckbRelationship } from '@prisma/client';
import { knowledgeGraphRepository } from '../repositories/knowledge-graph-repository';
import { getEntityDefinition } from './registry';

export type Direction = 'out' | 'in' | 'both';

export interface GraphNode {
  id: string;
  entityType: string;
  domain: string | null;
  recordKey: string;
  name: string;
  status: string;
}

export interface GraphEdge {
  fromId: string;
  relationType: string;
  toType: string;
  toId: string | null;
  toRef: string | null;
  direction: 'out' | 'in';
}

export interface Subgraph {
  root: GraphNode | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** True if the traversal hit the node cap and stopped early. */
  truncated: boolean;
}

export interface TraversalOptions {
  depth?: number;
  direction?: Direction;
  relationTypes?: string[];
  /** Safety cap on the number of nodes returned. */
  maxNodes?: number;
}

const DEFAULT_DEPTH = 1;
const DEFAULT_MAX_NODES = 250;
const HARD_MAX_DEPTH = 6;

function toNode(r: GckbRecord): GraphNode {
  return {
    id: r.id,
    entityType: r.entityType,
    domain: getEntityDefinition(r.entityType)?.domain ?? null,
    recordKey: r.recordKey,
    name: r.name,
    status: r.status,
  };
}

function matchesType(edge: GckbRelationship, relationTypes?: string[]): boolean {
  return !relationTypes || relationTypes.length === 0 || relationTypes.includes(edge.relationType);
}

export const knowledgeGraphService = {
  /** A node with its immediate outgoing + incoming edges and the resolved neighbour nodes. */
  async getNode(
    organizationId: string | null,
    id: string,
  ): Promise<{ node: GraphNode; edges: GraphEdge[]; neighbours: GraphNode[] } | null> {
    const record = await knowledgeGraphRepository.nodeById(id, organizationId);
    if (!record) return null;
    const [out, inc] = await Promise.all([
      knowledgeGraphRepository.outgoing([id], organizationId),
      knowledgeGraphRepository.incoming([id], organizationId),
    ]);
    const edges: GraphEdge[] = [
      ...out.map((e) => ({ fromId: e.fromId, relationType: e.relationType, toType: e.toType, toId: e.toId, toRef: e.toRef, direction: 'out' as const })),
      ...inc.map((e) => ({ fromId: e.fromId, relationType: e.relationType, toType: e.toType, toId: e.toId, toRef: e.toRef, direction: 'in' as const })),
    ];
    const neighbourIds = unique([
      ...out.map((e) => e.toId).filter((x): x is string => Boolean(x)),
      ...inc.map((e) => e.fromId),
    ]).filter((nid) => nid !== id);
    const neighbours = (await knowledgeGraphRepository.nodesByIds(neighbourIds, organizationId)).map(toNode);
    return { node: toNode(record), edges, neighbours };
  },

  /**
   * Bounded breadth-first traversal from a root node, returning the reachable
   * subgraph (nodes + edges) up to `depth`, following `direction` and optionally
   * filtered to `relationTypes`. Capped at `maxNodes` for safety.
   */
  async traverse(organizationId: string | null, startId: string, opts: TraversalOptions = {}): Promise<Subgraph | null> {
    const depth = Math.min(HARD_MAX_DEPTH, Math.max(1, opts.depth ?? DEFAULT_DEPTH));
    const direction = opts.direction ?? 'both';
    const maxNodes = Math.max(1, opts.maxNodes ?? DEFAULT_MAX_NODES);

    const root = await knowledgeGraphRepository.nodeById(startId, organizationId);
    if (!root) return null;

    const nodes = new Map<string, GraphNode>([[root.id, toNode(root)]]);
    const edges: GraphEdge[] = [];
    const seenEdge = new Set<string>();
    let frontier = [startId];
    let truncated = false;

    for (let level = 0; level < depth && frontier.length > 0; level += 1) {
      const [out, inc] = await Promise.all([
        direction === 'in' ? Promise.resolve<GckbRelationship[]>([]) : knowledgeGraphRepository.outgoing(frontier, organizationId),
        direction === 'out' ? Promise.resolve<GckbRelationship[]>([]) : knowledgeGraphRepository.incoming(frontier, organizationId),
      ]);

      const discovered: string[] = [];
      const collect = (e: GckbRelationship, dir: 'out' | 'in', neighbourId: string | null) => {
        if (!matchesType(e, opts.relationTypes)) return;
        const key = `${e.fromId}|${e.relationType}|${e.toId ?? e.toRef}|${dir}`;
        if (!seenEdge.has(key)) {
          seenEdge.add(key);
          edges.push({ fromId: e.fromId, relationType: e.relationType, toType: e.toType, toId: e.toId, toRef: e.toRef, direction: dir });
        }
        if (neighbourId && !nodes.has(neighbourId)) discovered.push(neighbourId);
      };
      for (const e of out) collect(e, 'out', e.toId);
      for (const e of inc) collect(e, 'in', e.fromId);

      const nextIds = unique(discovered);
      const fetched = await knowledgeGraphRepository.nodesByIds(nextIds, organizationId);
      const nextFrontier: string[] = [];
      for (const r of fetched) {
        if (nodes.size >= maxNodes) {
          truncated = true;
          break;
        }
        if (!nodes.has(r.id)) {
          nodes.set(r.id, toNode(r));
          nextFrontier.push(r.id);
        }
      }
      frontier = nextFrontier;
      if (truncated) break;
    }

    return { root: toNode(root), nodes: [...nodes.values()], edges, truncated };
  },

  /**
   * Shortest path (by hop count) between two nodes, following edges in `direction`.
   * Returns the ordered node ids, or null if unreachable within `maxDepth`.
   */
  async shortestPath(
    organizationId: string | null,
    fromId: string,
    toId: string,
    opts: { direction?: Direction; maxDepth?: number } = {},
  ): Promise<string[] | null> {
    if (fromId === toId) return [fromId];
    const direction = opts.direction ?? 'out';
    const maxDepth = Math.min(HARD_MAX_DEPTH, Math.max(1, opts.maxDepth ?? HARD_MAX_DEPTH));

    const prev = new Map<string, string>();
    const visited = new Set<string>([fromId]);
    let frontier = [fromId];

    for (let level = 0; level < maxDepth && frontier.length > 0; level += 1) {
      const [out, inc] = await Promise.all([
        direction === 'in' ? Promise.resolve<GckbRelationship[]>([]) : knowledgeGraphRepository.outgoing(frontier, organizationId),
        direction === 'out' ? Promise.resolve<GckbRelationship[]>([]) : knowledgeGraphRepository.incoming(frontier, organizationId),
      ]);
      const next: string[] = [];
      const step = (parentCandidates: GckbRelationship[], pick: (e: GckbRelationship) => { parent: string; child: string | null }) => {
        for (const e of parentCandidates) {
          const { parent, child } = pick(e);
          if (!child || visited.has(child)) continue;
          visited.add(child);
          prev.set(child, parent);
          if (child === toId) return true;
          next.push(child);
        }
        return false;
      };
      if (step(out, (e) => ({ parent: e.fromId, child: e.toId })) || step(inc, (e) => ({ parent: e.toId ?? '', child: e.fromId }))) {
        return reconstruct(prev, fromId, toId);
      }
      frontier = next;
    }
    return null;
  },
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function reconstruct(prev: Map<string, string>, from: string, to: string): string[] {
  const path = [to];
  let cur = to;
  while (cur !== from) {
    const p = prev.get(cur);
    if (!p) break;
    path.unshift(p);
    cur = p;
  }
  return path;
}
