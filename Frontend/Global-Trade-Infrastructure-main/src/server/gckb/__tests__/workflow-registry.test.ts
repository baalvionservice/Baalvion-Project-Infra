/**
 * @file server/gckb/__tests__/workflow-registry.test.ts
 * @description Unit tests for MODULE 6 — the workflow_template GCKB registry
 * entity. Validation combines the zod shape with the engine's structural checks.
 */
import { describe, it, expect } from 'vitest';
import { getEntityDefinition, isKnownEntity } from '../registry';
import { WORKFLOW_RELATIONSHIP_TYPES } from '../registries/workflow';

const validTemplate = {
  workflowType: 'KYC',
  initialState: 'NEW',
  states: [
    { key: 'NEW', kind: 'INITIAL' },
    { key: 'REVIEW', kind: 'INTERMEDIATE' },
    { key: 'CLEARED', kind: 'FINAL' },
  ],
  transitions: [
    { key: 'start', from: 'NEW', to: 'REVIEW', on: 'START' },
    { key: 'clear', from: 'REVIEW', to: 'CLEARED', on: 'CLEAR' },
  ],
};

describe('workflow_template registry', () => {
  const def = getEntityDefinition('workflow_template')!;

  it('is registered in the workflow domain', () => {
    expect(isKnownEntity('workflow_template')).toBe(true);
    expect(def.domain).toBe('workflow');
  });

  it('keys by WORKFLOWTYPE:code', () => {
    expect(def.deriveRecordKey({ name: 'KYC flow', code: 'std', attributes: { workflowType: 'kyc' } })).toBe('KYC:STD');
  });

  it('accepts a structurally valid template', () => {
    expect(def.validate({ name: 'KYC', attributes: validTemplate }).ok).toBe(true);
  });

  it('rejects a template that references a non-existent target state', () => {
    const bad = { ...validTemplate, transitions: [{ key: 'x', from: 'NEW', to: 'GHOST', on: 'GO' }] };
    const r = def.validate({ name: 'Broken', attributes: bad });
    expect(r.ok).toBe(false);
  });

  it('rejects a template with no final state (structural integrity)', () => {
    const bad = { ...validTemplate, states: [{ key: 'NEW', kind: 'INITIAL' }, { key: 'REVIEW', kind: 'INTERMEDIATE' }], transitions: [{ key: 'start', from: 'NEW', to: 'REVIEW', on: 'START' }] };
    expect(def.validate({ name: 'NoFinal', attributes: bad }).ok).toBe(false);
  });

  it('rejects a payload that fails the zod shape (empty states)', () => {
    expect(def.validate({ name: 'Empty', attributes: { initialState: 'NEW', states: [], transitions: [] } }).ok).toBe(false);
  });

  it('declares workflow relationship edges', () => {
    const rels = (def.relationshipTypes ?? []).map((r) => r.relationType);
    expect(rels).toContain(WORKFLOW_RELATIONSHIP_TYPES.HAS_SUBWORKFLOW);
    expect(rels).toContain(WORKFLOW_RELATIONSHIP_TYPES.PRODUCES_DOCUMENT);
  });
});
