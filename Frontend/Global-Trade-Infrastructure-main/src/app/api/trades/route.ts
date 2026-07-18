/**
 * @file app/api/trades/route.ts
 * @description Collection endpoints: create a trade, list trades.
 */
import { tradeService } from '@/server/services/trade-service';
import {
  principalFrom,
  ok,
  fail,
  toErrorResponse,
  parsePagination,
  createTradeSchema,
} from '@/server/http/api';
import { logSecurityEvent } from '@/server/http/security-log';
import { USER_ROLES } from '@/core/roles';

export const runtime = 'nodejs';

// Server-side function-level authorization (authz C-4 pattern, mirrors
// finance/[requestId]/decision): only roles that represent an actual trade participant or
// org-commercial-authority may bind the organization to a new trade. Oversight/external-authority
// roles (regulators, auditors, arbitrators, bank/insurance/customs nodes) and the least-privilege
// baseline (MEMBER) are deliberately excluded — the client UI is not the security boundary.
const TRADE_CREATOR_ROLES = new Set<string>([
  USER_ROLES.BUYER,
  USER_ROLES.BUYER_NODE,
  USER_ROLES.SELLER,
  USER_ROLES.SELLER_NODE,
  USER_ROLES.AGENT,
  USER_ROLES.ORG_OWNER,
  USER_ROLES.EXECUTIVE_DIRECTOR,
  USER_ROLES.OPERATIONS_DIRECTOR,
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.PLATFORM_ADMIN,
]);

export async function POST(req: Request) {
  try {
    // Identity AND tenant come solely from the verified principal (CR-1/CR-3).
    const principal = principalFrom(req);
    // Authorization is checked SEPARATELY from authentication: a verified principal is not
    // automatically entitled to create a trade on behalf of their organization.
    if (!TRADE_CREATOR_ROLES.has(String(principal.actorRole))) {
      logSecurityEvent(
        'trade_create_denied',
        { actorId: principal.actorId, organizationId: principal.organizationId, role: String(principal.actorRole) },
        'warn',
      );
      return fail(403, 'Insufficient role to create a trade.');
    }
    const body = createTradeSchema.parse(await req.json());
    const organizationId = await tradeService.ensureOrganization({
      id: principal.organizationId,
      name: 'Baalvion Tenant',
      slug: `tenant-${principal.organizationId}`,
    });
    const graph = await tradeService.createTrade({
      organizationId,
      actor: { actorId: principal.actorId, actorRole: principal.actorRole },
      terms: body.terms,
      buyer: body.buyer,
      supplier: body.supplier,
      reference: body.reference,
      correlationId: body.correlationId,
      metadata: body.metadata,
    });
    return ok(graph, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function GET(req: Request) {
  try {
    // Authentication is mandatory and the tenant filter is forced to the
    // principal's organization — a client cannot widen or omit it (CR-3).
    const principal = principalFrom(req);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const where: Record<string, unknown> = { organizationId: principal.organizationId };
    const state = url.searchParams.get('state');
    if (state) where.currentState = state;
    const result = await tradeService.listTrades({ page, pageSize, where });
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
