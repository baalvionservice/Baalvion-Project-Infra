/**
 * @file app/api/gckb/graph/[id]/route.ts
 * @description MODULE 7 — Knowledge Graph API. Returns the tenant-scoped subgraph
 * reachable from a node: `?depth=` (1–6), `?direction=out|in|both`,
 * `?relationType=A,B` (filter), `?maxNodes=`. Authentication and tenant scope are
 * derived from the verified principal (never client headers).
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { NotFoundError } from '@/server/db/errors';
import { kbRequest } from '@/server/gckb/http';
import { knowledgeGraphService, type Direction } from '@/server/gckb/knowledge-graph';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { ctx: actor } = kbRequest(req);
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const q = url.searchParams;
    const depth = q.get('depth') ? Number(q.get('depth')) : undefined;
    const direction = (q.get('direction') as Direction) ?? undefined;
    const relationTypes = q.get('relationType')?.split(',').map((s) => s.trim()).filter(Boolean);
    const maxNodes = q.get('maxNodes') ? Number(q.get('maxNodes')) : undefined;

    const subgraph = await knowledgeGraphService.traverse(actor.organizationId, id, { depth, direction, relationTypes, maxNodes });
    if (!subgraph) throw new NotFoundError('GraphNode', id);
    return ok(subgraph);
  } catch (err) {
    return toErrorResponse(err);
  }
}
