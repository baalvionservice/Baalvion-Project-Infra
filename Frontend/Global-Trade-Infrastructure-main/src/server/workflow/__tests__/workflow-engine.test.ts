/**
 * @file server/workflow/__tests__/workflow-engine.test.ts
 * @description MODULE 6 — pure workflow-engine tests. No I/O: template validation,
 * guard-gated transitions (reusing the Rule-Engine condition language), N-of-M
 * approvals, terminal/cancellation detection, timeouts and sub-workflows are all
 * deterministic and database-free.
 */
import { describe, it, expect } from 'vitest';
import { WorkflowTemplate } from '../workflow-types';
import {
  availableTransitions,
  cancellationTransition,
  fireTransition,
  isFinal,
  isTerminal,
  timeoutTarget,
  validateWorkflowTemplate,
} from '../workflow-engine';

const tradeWf: WorkflowTemplate = {
  workflowType: 'TRADE',
  initialState: 'DRAFT',
  cancellable: true,
  states: [
    { key: 'DRAFT', kind: 'INITIAL' },
    { key: 'SUBMITTED', kind: 'INTERMEDIATE', timeoutSeconds: 86400, onTimeoutState: 'EXPIRED', escalateTo: 'COMPLIANCE' },
    { key: 'APPROVED', kind: 'INTERMEDIATE' },
    { key: 'COMPLETED', kind: 'FINAL' },
    { key: 'EXPIRED', kind: 'FINAL' },
    { key: 'CANCELLED', kind: 'CANCELLED' },
  ],
  transitions: [
    { key: 'submit', from: 'DRAFT', to: 'SUBMITTED', on: 'SUBMIT' },
    { key: 'approve', from: 'SUBMITTED', to: 'APPROVED', on: 'APPROVE', guard: { fact: 'amount', op: 'lte', value: 100000 }, approvals: [{ role: 'COMPLIANCE', minCount: 1 }, { role: 'FINANCE', minCount: 2 }] },
    { key: 'highValueReview', from: 'SUBMITTED', to: 'APPROVED', on: 'APPROVE', guard: { fact: 'amount', op: 'gt', value: 100000 }, approvals: [{ role: 'BOARD', minCount: 1 }] },
    { key: 'complete', from: 'APPROVED', to: 'COMPLETED', on: 'COMPLETE' },
    { key: 'cancel', from: '*', to: 'CANCELLED', on: 'CANCEL', isCancellation: true },
  ],
};

describe('template validation', () => {
  it('accepts a well-formed template', () => {
    expect(validateWorkflowTemplate(tradeWf)).toEqual([]);
  });

  it('reports missing initial/final states, dangling transitions and bad guards', () => {
    const broken: WorkflowTemplate = {
      initialState: 'NOWHERE',
      states: [{ key: 'A', kind: 'INTERMEDIATE' }],
      transitions: [{ key: 't', from: 'A', to: 'B', on: 'GO', guard: { fact: '', op: 'eq' } as never }],
    };
    const errors = validateWorkflowTemplate(broken);
    expect(errors.join(' ')).toMatch(/initialState/);
    expect(errors.join(' ')).toMatch(/at least one FINAL/);
    expect(errors.join(' ')).toMatch(/to "B" is not a state/);
    expect(errors.join(' ')).toMatch(/guard/);
  });
});

describe('guard-gated transitions (reusing the rule condition language)', () => {
  it('selects the low-value path under the threshold and the high-value path over it', () => {
    const low = availableTransitions(tradeWf, 'SUBMITTED', { amount: 50000 }).map((t) => t.key);
    expect(low).toContain('approve');
    expect(low).not.toContain('highValueReview');

    const high = availableTransitions(tradeWf, 'SUBMITTED', { amount: 200000 }).map((t) => t.key);
    expect(high).toContain('highValueReview');
    expect(high).not.toContain('approve');
    // The any-state cancel is always available while cancellable.
    expect(high).toContain('cancel');
  });
});

describe('firing transitions + approvals', () => {
  it('advances on a guardless transition', () => {
    const r = fireTransition(tradeWf, 'DRAFT', 'SUBMIT', {});
    expect(r).toMatchObject({ ok: true, nextState: 'SUBMITTED' });
  });

  it('blocks until N-of-M approvals are collected', () => {
    const pending = fireTransition(tradeWf, 'SUBMITTED', 'APPROVE', { amount: 50000 });
    expect(pending.ok).toBe(false);
    expect(pending.requiresApproval).toBe(true);
    expect(pending.missingApprovals).toEqual(
      expect.arrayContaining([
        { role: 'COMPLIANCE', required: 1, granted: 0 },
        { role: 'FINANCE', required: 2, granted: 0 },
      ]),
    );

    const partial = fireTransition(tradeWf, 'SUBMITTED', 'APPROVE', { amount: 50000 }, { grantedApprovals: [{ role: 'COMPLIANCE' }, { role: 'FINANCE', count: 1 }] });
    expect(partial.ok).toBe(false); // FINANCE needs 2

    const ok = fireTransition(tradeWf, 'SUBMITTED', 'APPROVE', { amount: 50000 }, { grantedApprovals: [{ role: 'COMPLIANCE' }, { role: 'FINANCE', count: 2 }] });
    expect(ok).toMatchObject({ ok: true, nextState: 'APPROVED' });
  });

  it('routes a high-value trade through the board path', () => {
    const pending = fireTransition(tradeWf, 'SUBMITTED', 'APPROVE', { amount: 250000 });
    expect(pending).toMatchObject({ requiresApproval: true, transitionKey: 'highValueReview' });
    const ok = fireTransition(tradeWf, 'SUBMITTED', 'APPROVE', { amount: 250000 }, { grantedApprovals: [{ role: 'BOARD' }] });
    expect(ok).toMatchObject({ ok: true, nextState: 'APPROVED' });
  });

  it('refuses to fire from a terminal state and for unknown events', () => {
    expect(fireTransition(tradeWf, 'COMPLETED', 'COMPLETE', {}).ok).toBe(false);
    expect(fireTransition(tradeWf, 'DRAFT', 'NONSENSE', {}).ok).toBe(false);
  });
});

describe('cancellation, timeouts and terminal detection', () => {
  it('exposes the any-state cancellation transition', () => {
    expect(cancellationTransition(tradeWf, 'SUBMITTED')?.key).toBe('cancel');
    expect(cancellationTransition({ ...tradeWf, cancellable: false }, 'SUBMITTED')).toBeNull();
  });

  it('resolves the timeout target and escalation', () => {
    expect(timeoutTarget(tradeWf, 'SUBMITTED')).toEqual({ state: 'EXPIRED', escalateTo: 'COMPLIANCE' });
    expect(timeoutTarget(tradeWf, 'DRAFT')).toBeNull();
  });

  it('detects final and terminal states', () => {
    expect(isFinal(tradeWf, 'COMPLETED')).toBe(true);
    expect(isFinal(tradeWf, 'SUBMITTED')).toBe(false);
    expect(isTerminal(tradeWf, 'CANCELLED')).toBe(true);
  });
});
