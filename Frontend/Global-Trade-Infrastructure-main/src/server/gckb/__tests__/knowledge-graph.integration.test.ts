/**
 * @file server/gckb/__tests__/knowledge-graph.integration.test.ts
 * @description MODULE 7 integration tests against real PostgreSQL. Builds a small
 * cross-domain graph (organization → product → manufacturer → HS code, plus a
 * certificate edge) from the real registries and proves neighbour lookup, bounded
 * traversal, shortest path and RLS scoping over `gckb_relationships`.
 */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDatabase, seedOrganization, disconnect } from '../../test/db';
import { gckbService, KbActorContext } from '../../services/gckb-service';
import { knowledgeGraphService } from '../knowledge-graph';
import { PRODUCT_RELATIONSHIP_TYPES } from '../registries/product';
import { ORG_RELATIONSHIP_TYPES } from '../registries/organization';

function ctxFor(orgId: string | null): KbActorContext {
  return { organizationId: orgId, actorId: 'kg-admin', actorRole: 'PLATFORM_ADMIN', source: 'test' };
}

describe('knowledge graph (PostgreSQL)', () => {
  let orgA: string;
  let orgB: string;

  beforeEach(async () => {
    await resetDatabase();
    orgA = await seedOrganization('Org A');
    orgB = await seedOrganization('Org B');
  });
  afterAll(async () => {
    await disconnect();
  });

  async function buildGraph(ctx: KbActorContext) {
    const org = await gckbService.create(ctx, 'organization', { name: 'Acme Foods', attributes: { registrationNumber: 'ACME-1' } });
    const product = await gckbService.create(ctx, 'product', { name: 'Basmati Rice', code: 'RICE-1', hsCode: '100630', attributes: {} });
    const maker = await gckbService.create(ctx, 'manufacturer', { name: 'Acme Mfg', code: 'ACME-MFG', attributes: {} });
    const hs = await gckbService.create(ctx, 'hs_code', { name: 'Milled rice', hsCode: '100630', attributes: { level: 6 } });

    await gckbService.addRelationship(ctx, org.id, { relationType: ORG_RELATIONSHIP_TYPES.SUPPLIES, toType: 'product', toId: product.id });
    await gckbService.addRelationship(ctx, product.id, { relationType: PRODUCT_RELATIONSHIP_TYPES.MANUFACTURED_BY, toType: 'manufacturer', toId: maker.id });
    await gckbService.addRelationship(ctx, product.id, { relationType: PRODUCT_RELATIONSHIP_TYPES.CLASSIFIED_UNDER_HS, toType: 'hs_code', toId: hs.id });
    return { org, product, maker, hs };
  }

  it('returns a node with its immediate neighbours', async () => {
    const ctx = ctxFor(orgA);
    const { product } = await buildGraph(ctx);
    const result = await knowledgeGraphService.getNode(orgA, product.id);
    expect(result).not.toBeNull();
    expect(result!.node.entityType).toBe('product');
    // outgoing: manufacturer + hs_code; incoming: organization SUPPLIES
    expect(result!.neighbours.map((n) => n.entityType).sort()).toEqual(['hs_code', 'manufacturer', 'organization']);
  });

  it('traverses a bounded subgraph from the organization', async () => {
    const ctx = ctxFor(orgA);
    const { org } = await buildGraph(ctx);
    const sub = await knowledgeGraphService.traverse(orgA, org.id, { depth: 3, direction: 'out' });
    expect(sub).not.toBeNull();
    const types = sub!.nodes.map((n) => n.entityType).sort();
    expect(types).toEqual(['hs_code', 'manufacturer', 'organization', 'product']);
    expect(sub!.edges.length).toBeGreaterThanOrEqual(3);
    expect(sub!.truncated).toBe(false);
  });

  it('filters traversal by relation type', async () => {
    const ctx = ctxFor(orgA);
    const { product } = await buildGraph(ctx);
    const sub = await knowledgeGraphService.traverse(orgA, product.id, { depth: 1, direction: 'out', relationTypes: [PRODUCT_RELATIONSHIP_TYPES.MANUFACTURED_BY] });
    expect(sub!.nodes.map((n) => n.entityType).sort()).toEqual(['manufacturer', 'product']);
  });

  it('finds a shortest path organization → product → hs_code', async () => {
    const ctx = ctxFor(orgA);
    const { org, product, hs } = await buildGraph(ctx);
    const path = await knowledgeGraphService.shortestPath(orgA, org.id, hs.id, { direction: 'out' });
    expect(path).toEqual([org.id, product.id, hs.id]);
  });

  it('RLS: another tenant cannot traverse into Org A\'s private graph', async () => {
    const ctx = ctxFor(orgA);
    const { org } = await buildGraph(ctx);
    // Org B sees neither the node nor its edges.
    expect(await knowledgeGraphService.getNode(orgB, org.id)).toBeNull();
    expect(await knowledgeGraphService.traverse(orgB, org.id, { depth: 2 })).toBeNull();
  });
});
