/**
 * @file server/workflow/workflow-engine.ts
 * @description MODULE 6 — Data-Driven Workflow Engine: a pure, deterministic
 * evaluator over workflow templates (configuration). It computes the valid
 * transitions from a state, whether an event may fire (guard + approvals), the
 * resulting next state, terminal/cancellation detection and timeout behaviour —
 * all without a database and without any hardcoded state machine. Guards reuse
 * the Rule Engine's `evaluateCondition` / `validateCondition`, so there is one
 * structured condition language across the platform (no `eval`).
 */
import { evaluateCondition, validateCondition, type Facts } from '../rules/condition';
import { WorkflowTemplate, WorkflowState, WorkflowTransition } from './workflow-types';

/** Approvals already granted for a pending transition. */
export interface GrantedApproval {
  role: string;
  count?: number; // default 1
}

export interface FireOutcome {
  ok: boolean;
  nextState?: string;
  /** True when the transition exists + guard passes but approvals are outstanding. */
  requiresApproval?: boolean;
  missingApprovals?: Array<{ role: string; required: number; granted: number }>;
  transitionKey?: string;
  error?: string;
}

function stateOf(template: WorkflowTemplate, key: string): WorkflowState | undefined {
  return template.states.find((s) => s.key === key);
}

function guardPasses(transition: WorkflowTransition, facts: Facts): boolean {
  return transition.guard ? evaluateCondition(transition.guard, facts) : true;
}

/**
 * Structurally validate a workflow template (write-boundary validation). Returns
 * human-readable errors; an empty list means the template is well-formed.
 */
export function validateWorkflowTemplate(template: WorkflowTemplate): string[] {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const s of template.states) {
    if (keys.has(s.key)) errors.push(`duplicate state key "${s.key}"`);
    keys.add(s.key);
  }
  if (!keys.has(template.initialState)) {
    errors.push(`initialState "${template.initialState}" is not a declared state`);
  }
  if (!template.states.some((s) => s.kind === 'FINAL')) {
    errors.push('a workflow must declare at least one FINAL state');
  }

  const transitionKeys = new Set<string>();
  for (const t of template.transitions) {
    if (transitionKeys.has(t.key)) errors.push(`duplicate transition key "${t.key}"`);
    transitionKeys.add(t.key);
    if (t.from !== '*' && !keys.has(t.from)) errors.push(`transition "${t.key}": from "${t.from}" is not a state`);
    if (!keys.has(t.to)) errors.push(`transition "${t.key}": to "${t.to}" is not a state`);
    if (t.guard) {
      for (const e of validateCondition(t.guard, `transition "${t.key}".guard`)) errors.push(e);
    }
  }
  for (const sw of template.subWorkflows ?? []) {
    if (!keys.has(sw.onState)) errors.push(`subWorkflow "${sw.key}": onState "${sw.onState}" is not a state`);
  }
  // Escalation / timeout targets must reference real states where given as states.
  for (const s of template.states) {
    if (s.onTimeoutState && !keys.has(s.onTimeoutState)) {
      errors.push(`state "${s.key}": onTimeoutState "${s.onTimeoutState}" is not a state`);
    }
  }
  return errors;
}

/** Every transition leaving `currentState` whose guard passes against `facts`. */
export function availableTransitions(template: WorkflowTemplate, currentState: string, facts: Facts = {}): WorkflowTransition[] {
  return template.transitions.filter((t) => (t.from === currentState || t.from === '*') && guardPasses(t, facts));
}

/** The transition fired by `event` from `currentState`, or null if none qualifies. */
export function findTransition(template: WorkflowTemplate, currentState: string, event: string, facts: Facts = {}): WorkflowTransition | null {
  return availableTransitions(template, currentState, facts).find((t) => t.on === event) ?? null;
}

function approvalsSatisfied(
  transition: WorkflowTransition,
  granted: GrantedApproval[],
): { ok: boolean; missing: Array<{ role: string; required: number; granted: number }> } {
  const missing: Array<{ role: string; required: number; granted: number }> = [];
  for (const req of transition.approvals ?? []) {
    const required = req.minCount ?? 1;
    const have = granted.filter((g) => g.role === req.role).reduce((sum, g) => sum + (g.count ?? 1), 0);
    if (have < required) missing.push({ role: req.role, required, granted: have });
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Attempt to fire `event` from `currentState`. Pure: returns the outcome (next
 * state, or an approval-pending / error result) without mutating anything.
 */
export function fireTransition(
  template: WorkflowTemplate,
  currentState: string,
  event: string,
  facts: Facts = {},
  opts: { grantedApprovals?: GrantedApproval[] } = {},
): FireOutcome {
  if (isTerminal(template, currentState)) {
    return { ok: false, error: `state "${currentState}" is terminal` };
  }
  const transition = findTransition(template, currentState, event, facts);
  if (!transition) {
    return { ok: false, error: `no transition for event "${event}" from state "${currentState}" (guard not met or undefined)` };
  }
  const { ok, missing } = approvalsSatisfied(transition, opts.grantedApprovals ?? []);
  if (!ok) {
    return { ok: false, requiresApproval: true, missingApprovals: missing, transitionKey: transition.key };
  }
  return { ok: true, nextState: transition.to, transitionKey: transition.key };
}

export function isFinal(template: WorkflowTemplate, stateKey: string): boolean {
  return stateOf(template, stateKey)?.kind === 'FINAL';
}

export function isTerminal(template: WorkflowTemplate, stateKey: string): boolean {
  const kind = stateOf(template, stateKey)?.kind;
  return kind === 'FINAL' || kind === 'CANCELLED';
}

/** The cancellation transition available from `currentState`, if the template is cancellable. */
export function cancellationTransition(template: WorkflowTemplate, currentState: string, facts: Facts = {}): WorkflowTransition | null {
  if (!template.cancellable) return null;
  return availableTransitions(template, currentState, facts).find((t) => t.isCancellation) ?? null;
}

/** The state to move to when `currentState` times out (if configured). */
export function timeoutTarget(template: WorkflowTemplate, currentState: string): { state?: string; escalateTo?: string } | null {
  const s = stateOf(template, currentState);
  if (!s || (!s.onTimeoutState && !s.escalateTo)) return null;
  return { state: s.onTimeoutState, escalateTo: s.escalateTo };
}

/** Sub-workflows that should spawn when entering `stateKey`. */
export function subWorkflowsFor(template: WorkflowTemplate, stateKey: string): WorkflowTemplate['subWorkflows'] {
  return (template.subWorkflows ?? []).filter((sw) => sw.onState === stateKey);
}
