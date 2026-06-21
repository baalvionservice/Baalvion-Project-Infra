/**
 * @file server/gckb/registries/workflow.ts
 * @description MODULE 6 — Data-Driven Workflow Engine: the `workflow_template`
 * GCKB registry entity. A template is configuration validated both by the zod
 * shape and by the engine's structural checks (initial/final states exist,
 * transitions reference real states, guards are valid Rule-Engine conditions).
 * Registering it with the GCKB engine gives templates versioning, history,
 * search, import/export, audit, events and RLS — **no new table, migration,
 * service or route**. The pure evaluator lives in
 * `server/workflow/workflow-engine.ts`. Nothing is seeded.
 */
import { z } from 'zod';
import { KbWriteInput } from '../types';
import { KbEntityDefinition, RelationshipTypeDescriptor, slug } from '../entity-kit';
import { workflowTemplateSchema } from '../../workflow/workflow-types';
import { validateWorkflowTemplate } from '../../workflow/workflow-engine';

/** Typed relationship edges for workflow templates (no magic strings). */
export const WORKFLOW_RELATIONSHIP_TYPES = {
  /** workflow_template → workflow_template (nested sub-workflow) */
  HAS_SUBWORKFLOW: 'HAS_SUBWORKFLOW',
  /** workflow_template → rule (a guard sourced from the Rule Engine) */
  USES_RULE: 'USES_RULE',
  /** workflow_template → document_template (a document this workflow issues) */
  PRODUCES_DOCUMENT: 'PRODUCES_DOCUMENT',
  /** workflow_template → any entity it drives (external ref: trade, certificate, …) */
  GOVERNS: 'GOVERNS',
} as const;

export type WorkflowRelationshipType =
  (typeof WORKFLOW_RELATIONSHIP_TYPES)[keyof typeof WORKFLOW_RELATIONSHIP_TYPES];

function zodErrors(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) return [];
  return result.error.issues.map((i) => `attributes.${i.path.join('.')}: ${i.message}`);
}

function workflowKey(i: KbWriteInput): string {
  const wfType = i.attributes?.workflowType ? String(i.attributes.workflowType).toUpperCase() : null;
  const code = i.code ? String(i.code).toUpperCase() : slug(i.name).toUpperCase();
  return wfType ? `${wfType}:${code}` : code;
}

const workflowRelationshipTypes: RelationshipTypeDescriptor[] = [
  { relationType: WORKFLOW_RELATIONSHIP_TYPES.HAS_SUBWORKFLOW, label: 'Has sub-workflow', toType: 'workflow_template' },
  { relationType: WORKFLOW_RELATIONSHIP_TYPES.USES_RULE, label: 'Uses rule', toType: 'rule' },
  { relationType: WORKFLOW_RELATIONSHIP_TYPES.PRODUCES_DOCUMENT, label: 'Produces document', toType: 'document_template' },
  { relationType: WORKFLOW_RELATIONSHIP_TYPES.GOVERNS, label: 'Governs', toType: 'entity' },
];

const workflowTemplateEntity: KbEntityDefinition = {
  entityType: 'workflow_template',
  label: 'Workflow Template',
  description: 'A data-driven workflow definition (states, transitions, guards, approvals, parallel/sequential steps, escalations, retries, timeouts, rollback, cancellation, sub-workflows) — the configurable replacement for hardcoded state machines.',
  domain: 'workflow',
  countryScoped: false,
  usesPolicyType: false,
  deriveRecordKey: (input) => input.recordKey?.trim() || workflowKey(input),
  validate: (input) => {
    const parsed = workflowTemplateSchema.safeParse(input.attributes ?? {});
    if (!parsed.success) return { ok: false, errors: zodErrors(parsed) };
    const structural = validateWorkflowTemplate(parsed.data);
    return structural.length ? { ok: false, errors: structural } : { ok: true };
  },
  events: { created: 'WORKFLOW_TEMPLATE_CREATED', updated: 'WORKFLOW_TEMPLATE_UPDATED', archived: 'WORKFLOW_TEMPLATE_ARCHIVED' },
  relationshipTypes: workflowRelationshipTypes,
  formFields: [
    { name: 'name', label: 'Workflow name', type: 'string', placement: 'top', required: true },
    { name: 'code', label: 'Code', type: 'string', placement: 'top' },
    { name: 'tags', label: 'Tags', type: 'string[]', placement: 'top' },
    { name: 'workflowType', label: 'Workflow type', type: 'string', placement: 'attributes' },
    { name: 'initialState', label: 'Initial state', type: 'string', placement: 'attributes', required: true },
    { name: 'states', label: 'States', type: 'json', placement: 'attributes', required: true },
    { name: 'transitions', label: 'Transitions', type: 'json', placement: 'attributes', required: true },
    { name: 'cancellable', label: 'Cancellable', type: 'boolean', placement: 'attributes' },
    { name: 'subWorkflows', label: 'Sub-workflows', type: 'json', placement: 'attributes' },
  ],
};

export const workflowEntities: KbEntityDefinition[] = [workflowTemplateEntity];
