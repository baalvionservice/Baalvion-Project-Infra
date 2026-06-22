/**
 * @file server/workflow/workflow-types.ts
 * @description MODULE 6 — Data-Driven Workflow Engine: the configuration model
 * for workflow templates. A template replaces a hardcoded state machine with
 * DATA — states, transitions, guards, approvals, parallel/sequential steps,
 * escalations, retries, timeouts, delegation, rollback, cancellation and
 * sub-workflows are all declared, never coded. Transition guards reuse the Rule
 * Engine's structured `Condition` AST (no second condition language).
 */
import { z } from 'zod';
import type { Condition } from '../rules/condition';

export type { Condition };

/** State role in the lifecycle. */
export const STATE_KINDS = ['INITIAL', 'INTERMEDIATE', 'FINAL', 'CANCELLED'] as const;

export const stateSchema = z.object({
  key: z.string().min(1),
  name: z.string().optional(),
  kind: z.enum(STATE_KINDS).optional(),
  /** SLA: auto-escalate / time-out after this many seconds in the state. */
  timeoutSeconds: z.number().int().positive().optional(),
  /** Role or state key to escalate to on timeout. */
  escalateTo: z.string().optional(),
  /** State to auto-advance to when the timeout fires. */
  onTimeoutState: z.string().optional(),
});
export type WorkflowState = z.infer<typeof stateSchema>;

export const approvalSchema = z.object({
  role: z.string().min(1),
  /** Minimum approvals from this role (default 1) — supports N-of-M sign-off. */
  minCount: z.number().int().positive().optional(),
  /** Whether the approval may be delegated to another principal. */
  delegable: z.boolean().optional(),
});
export type ApprovalRequirement = z.infer<typeof approvalSchema>;

export const retrySchema = z.object({
  max: z.number().int().nonnegative(),
  backoffSeconds: z.number().int().nonnegative().optional(),
});

export const transitionSchema = z.object({
  key: z.string().min(1),
  /** Source state key, or `*` for an any-state transition (e.g. cancel). */
  from: z.string().min(1),
  /** Target state key. */
  to: z.string().min(1),
  /** Event/action name that triggers this transition. */
  on: z.string().min(1),
  /** Optional guard — a Rule-Engine condition AST evaluated against facts. */
  guard: z.custom<Condition>().optional(),
  /** Approvals that must be collected before the transition may fire. */
  approvals: z.array(approvalSchema).optional(),
  /** SEQUENTIAL (default) or PARALLEL (a fork/branch step). */
  mode: z.enum(['SEQUENTIAL', 'PARALLEL']).optional(),
  /** Auto-fire after this many seconds (timeout transition). */
  autoAfterSeconds: z.number().int().nonnegative().optional(),
  /** Retry policy for transitions backed by an external action. */
  retry: retrySchema.optional(),
  /** The transition key this one compensates (rollback edge). */
  compensates: z.string().optional(),
  /** Marks this as the cancellation transition. */
  isCancellation: z.boolean().optional(),
});
export type WorkflowTransition = z.infer<typeof transitionSchema>;

export const subWorkflowSchema = z.object({
  key: z.string().min(1),
  /** Natural key of another workflow_template to spawn. */
  templateKey: z.string().min(1),
  /** Spawn the sub-workflow when the parent enters this state. */
  onState: z.string().min(1),
  /** Whether the parent waits for the sub-workflow to reach a final state. */
  blocking: z.boolean().optional(),
});
export type SubWorkflow = z.infer<typeof subWorkflowSchema>;

export const workflowTemplateSchema = z.object({
  workflowType: z.string().optional(), // TRADE | SETTLEMENT | CERTIFICATE_ISSUANCE | KYC | …
  version: z.string().optional(),
  initialState: z.string().min(1),
  states: z.array(stateSchema).min(1),
  transitions: z.array(transitionSchema).min(1),
  cancellable: z.boolean().optional(),
  subWorkflows: z.array(subWorkflowSchema).optional(),
});
export type WorkflowTemplate = z.infer<typeof workflowTemplateSchema>;
