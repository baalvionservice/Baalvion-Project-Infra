/**
 * @file app/api/gckb/[entity]/validate/route.ts
 * @description Validate a record payload against the registry WITHOUT persisting
 * (spec §API Validation). Returns the derived natural key on success.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { NotFoundError } from '@/server/db/errors';
import { kbRequest, assertEntity } from '@/server/gckb/http';
import { getEntityDefinition } from '@/server/gckb/registry';
import { createRecordSchema } from '@/server/gckb/schemas';
import type { KbWriteInput } from '@/server/gckb/types';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ entity: string }> }) {
  try {
    kbRequest(req);
    const { entity } = await ctx.params;
    assertEntity(entity);
    const def = getEntityDefinition(entity);
    if (!def) throw new NotFoundError('GckbEntity', entity);

    const input = createRecordSchema.parse(await req.json()) as KbWriteInput;
    const errors: string[] = [];
    if (def.countryScoped && !input.countryCode) errors.push('countryCode is required');
    if (def.usesPolicyType && !input.policyType) errors.push('policyType is required');
    const result = def.validate(input);
    if (!result.ok) errors.push(...result.errors);

    return ok({
      valid: errors.length === 0,
      errors,
      recordKey: errors.length === 0 ? def.deriveRecordKey(input) : undefined,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
