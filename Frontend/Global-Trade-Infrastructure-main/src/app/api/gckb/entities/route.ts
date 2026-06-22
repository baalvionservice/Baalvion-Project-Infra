/**
 * @file app/api/gckb/entities/route.ts
 * @description Registry introspection — the entity types and policy types the
 * GCKB supports, with the declarative form + relationship metadata that drives
 * the registry-driven Admin UI's dynamic forms, filters and the public explorers.
 */
import { ok, toErrorResponse } from '@/server/http/api';
import { kbRequest } from '@/server/gckb/http';
import { listEntityTypes, getEntityDefinition, POLICY_TYPES } from '@/server/gckb/registry';
import { getPolicyForm, getPolicyGroup, POLICY_GROUPS } from '@/server/gckb/policy-forms';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    kbRequest(req); // authenticated
    const entities = listEntityTypes().map((entityType) => {
      const def = getEntityDefinition(entityType)!;
      return {
        entityType,
        label: def.label,
        description: def.description ?? null,
        domain: def.domain ?? 'country',
        countryScoped: def.countryScoped,
        usesPolicyType: def.usesPolicyType,
        formFields: def.formFields ?? [],
        relationshipTypes: def.relationshipTypes ?? [],
      };
    });
    const policyTypes = Object.values(POLICY_TYPES).map((p) => ({
      key: p.key,
      label: p.label,
      group: getPolicyGroup(p.key),
      formFields: getPolicyForm(p.key)?.formFields ?? [],
      createdEvent: p.createdEvent ?? null,
    }));
    return ok({ entities, policyTypes, policyGroups: POLICY_GROUPS });
  } catch (err) {
    return toErrorResponse(err);
  }
}
