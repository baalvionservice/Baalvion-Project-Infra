/**
 * @file server/services/publish-gate-service.ts
 * @description The compliance publish-gate application service. It runs the four
 * screens — restricted goods (rule engine), sanctions, country rules and AI
 * moderation — folds them into one verdict via the pure publish-gate combinator,
 * and persists a moderation case + the gate decision with an audit trail and
 * outbox event in one transaction. Human operators can then approve / reject /
 * publish / suspend through {@link decide}.
 */
import { randomUUID } from 'crypto';
import { Prisma, ModerationCase, PublishGate, AuditLog } from '@prisma/client';
import { withTransaction } from '../db/prisma';
import { NotFoundError, ValidationError } from '../db/errors';
import {
  moderationCaseRepository,
  publishGateRepository,
  auditRepository,
  outboxRepository,
  PublishGateFilter,
} from '../repositories';
import { flushOutbox } from '../orchestration/event-store';
import { moderateContent, type ModerationResult } from '../compliance/moderation-engine';
import { screenSanctions, type SanctionsContext } from '../compliance/sanctions-screening';
import { evaluateGate, type GateSignals, type CountrySignal } from '../compliance/publish-gate';
import { tryScreenGoods } from '../rules/goods-screening';
import type { ActorContext } from './rule-service';
import { ModerateInput, EvaluateGateInput, GateDecisionInput } from '../compliance/schemas';

// Baseline sanctions context. Tenant/GCKB-sourced lists can extend this; kept
// here as config so onboarding a sanctioned jurisdiction is a data change.
const BASELINE_SANCTIONS: SanctionsContext = {
  sanctionedCountries: ['IR', 'KP', 'SY', 'CU', 'RU'],
  highRiskCountries: ['AF', 'YE', 'SS', 'VE', 'MM'],
  deniedParties: ['darkstar holdings', 'redline logistics', 'sanctioned co'],
  pepNames: ['ivan petrov', 'general okonkwo', 'minister zhao'],
};

const MODERATION_STATUS: Record<ModerationResult['decision'], ModerationCase['status']> = {
  CLEAR: 'CLEARED',
  REVIEW: 'FLAGGED',
  BLOCK: 'BLOCKED',
};

const GATE_STATUS: Record<'APPROVE' | 'REVIEW' | 'REJECT', PublishGate['status']> = {
  APPROVE: 'APPROVED',
  REVIEW: 'IN_REVIEW',
  REJECT: 'REJECTED',
};

const TERMINAL_GATE = new Set<PublishGate['status']>([]); // none are hard-terminal; suspend/resubmit re-open

function snapshot<T>(row: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(row)) as Prisma.InputJsonValue;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

/** Derive a country-rule signal from the sanctions screen (embargo/high-risk). */
function countrySignalFrom(sanctionsMatches: { type: string; value: string; detail: string }[]): CountrySignal {
  const embargo = sanctionsMatches.filter((m) => m.type === 'COUNTRY_EMBARGO');
  const highRisk = sanctionsMatches.filter((m) => m.type === 'HIGH_RISK_COUNTRY');
  if (embargo.length > 0) return { status: 'EMBARGOED', reasons: embargo.map((m) => m.detail) };
  if (highRisk.length > 0) return { status: 'RESTRICTED', reasons: highRisk.map((m) => m.detail) };
  return { status: 'ALLOWED' };
}

export interface ModerateResult {
  moderationCase: ModerationCase;
  result: ModerationResult;
}

export interface GateEvaluationResult {
  gate: PublishGate;
  moderationCase: ModerationCase;
}

export const publishGateService = {
  // ── Stand-alone AI moderation ────────────────────────────────────────────────
  async moderate(ctx: ActorContext, input: ModerateInput): Promise<ModerateResult> {
    const result = moderateContent(input.content);
    const correlationId = randomUUID();
    const moderationCase = await withTransaction(async (tx) => {
      const row = (await moderationCaseRepository.create(
        {
          organizationId: ctx.organizationId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          reference: input.reference ?? null,
          status: MODERATION_STATUS[result.decision],
          decision: result.decision,
          score: result.score,
          model: 'heuristic-v1',
          labels: asJson(result.labels),
          reasons: asJson(result.reasons),
          metadata: input.metadata ? asJson(input.metadata) : undefined,
        },
        tx,
      )) as ModerationCase;
      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          entityType: 'ModerationCase',
          entityId: row.id,
          action: 'MODERATE',
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'compliance',
          afterState: snapshot(row),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          eventType: 'CONTENT_MODERATED',
          payload: { subjectType: input.subjectType, subjectId: input.subjectId, decision: result.decision, score: result.score, actorId: ctx.actorId } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return row;
    });
    await flushOutbox();
    return { moderationCase, result };
  },

  // ── Run the full publish gate ────────────────────────────────────────────────
  async evaluate(ctx: ActorContext, input: EvaluateGateInput): Promise<GateEvaluationResult> {
    const correlationId = randomUUID();

    // 1) AI moderation.
    const moderation = moderateContent(input.content);

    // 2) Restricted goods (rule engine; null when the rule set is not seeded).
    const goods = input.goods
      ? await tryScreenGoods(ctx, {
          hsCode: input.goods.hsCode,
          productCategory: input.goods.productCategory,
          originCountry: input.goods.originCountry ?? input.originCountry,
          destinationCountry: input.goods.destinationCountry ?? input.destinationCountry,
          direction: input.goods.direction,
          quantity: input.goods.quantity,
          value: input.goods.value,
        })
      : null;

    // 3) Sanctions + 4) country rules (derived from the sanctions screen).
    const sanctions = screenSanctions(
      { parties: input.parties, originCountry: input.originCountry, destinationCountry: input.destinationCountry },
      BASELINE_SANCTIONS,
    );
    const country = countrySignalFrom(sanctions.matches);

    const signals: GateSignals = {
      goods: goods
        ? {
            decision: goods.decision,
            prohibited: goods.prohibited,
            requiresReview: goods.requiresReview,
            requiredLicenses: goods.requiredLicenses,
            requiredCertificates: goods.requiredCertificates,
            reasons: goods.reasons,
          }
        : null,
      sanctions: { hit: sanctions.hit, requiresReview: sanctions.requiresReview, reasons: sanctions.reasons },
      country,
      moderation: { decision: moderation.decision, score: moderation.score, reasons: moderation.reasons },
    };
    const plan = evaluateGate(signals);

    const result = await withTransaction(async (tx) => {
      const moderationCase = (await moderationCaseRepository.create(
        {
          organizationId: ctx.organizationId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          status: MODERATION_STATUS[moderation.decision],
          decision: moderation.decision,
          score: moderation.score,
          model: 'heuristic-v1',
          labels: asJson(moderation.labels),
          reasons: asJson(moderation.reasons),
        },
        tx,
      )) as ModerationCase;

      const gateData = {
        status: GATE_STATUS[plan.decision],
        decision: plan.decision as PublishGate['decision'],
        checks: asJson(plan.checks),
        blockers: asJson(plan.blockers),
        warnings: asJson(plan.warnings),
        requiredActions: asJson(plan.requiredActions),
        goods: goods ? asJson(goods) : Prisma.JsonNull,
        sanctions: asJson(sanctions),
        country: asJson(country),
        moderationCaseId: moderationCase.id,
        evaluatedAt: new Date(),
      };

      const existing = await publishGateRepository.findActiveBySubject(ctx.organizationId, input.subjectType, input.subjectId, tx);
      let gate: PublishGate;
      if (existing) {
        gate = (await publishGateRepository.updateWithLock(existing.id, existing.version, gateData, tx)) as PublishGate;
      } else {
        gate = (await publishGateRepository.create(
          {
            organizationId: ctx.organizationId,
            subjectType: input.subjectType,
            subjectId: input.subjectId,
            reference: input.reference ?? null,
            tradeId: input.tradeId ?? null,
            metadata: input.metadata ? asJson(input.metadata) : undefined,
            ...gateData,
          },
          tx,
        )) as PublishGate;
      }

      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: gate.tradeId ?? undefined,
          entityType: 'PublishGate',
          entityId: gate.id,
          action: 'EVALUATE',
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'compliance',
          afterState: snapshot(gate),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: gate.tradeId ?? null,
          eventType: 'PUBLISH_GATE_EVALUATED',
          payload: { gateId: gate.id, subjectType: gate.subjectType, subjectId: gate.subjectId, decision: plan.decision, blockers: plan.blockers.length, actorId: ctx.actorId } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return { gate, moderationCase };
    });
    await flushOutbox();
    return result;
  },

  // ── Operator decision: approve / reject / publish / suspend / resubmit ────────
  async decide(ctx: ActorContext, gateId: string, input: GateDecisionInput): Promise<PublishGate> {
    const correlationId = randomUUID();
    const result = await withTransaction(async (tx) => {
      const before = await publishGateRepository.findScopedById(gateId, ctx.organizationId, tx);
      if (!before) throw new NotFoundError('PublishGate', gateId);
      if (TERMINAL_GATE.has(before.status)) throw new ValidationError(`TERMINAL_STATE: gate is ${before.status}`);

      const now = new Date();
      let data: Record<string, unknown>;
      switch (input.action) {
        case 'approve':
          if (!['SUBMITTED', 'IN_REVIEW', 'REJECTED'].includes(before.status)) {
            throw new ValidationError(`ILLEGAL_TRANSITION: cannot approve from ${before.status}`);
          }
          data = { status: 'APPROVED', decision: 'APPROVE', decidedBy: ctx.actorId, decidedAt: now };
          break;
        case 'reject':
          if (before.status === 'PUBLISHED') throw new ValidationError('ILLEGAL_TRANSITION: unpublish before rejecting');
          data = { status: 'REJECTED', decision: 'REJECT', decidedBy: ctx.actorId, decidedAt: now };
          break;
        case 'publish':
          if (before.status !== 'APPROVED') throw new ValidationError(`ILLEGAL_TRANSITION: cannot publish from ${before.status}`);
          data = { status: 'PUBLISHED', publishedAt: now };
          break;
        case 'suspend':
          if (before.status !== 'PUBLISHED') throw new ValidationError(`ILLEGAL_TRANSITION: cannot suspend from ${before.status}`);
          data = { status: 'SUSPENDED' };
          break;
        default: // resubmit
          if (!['REJECTED', 'SUSPENDED'].includes(before.status)) {
            throw new ValidationError(`ILLEGAL_TRANSITION: cannot resubmit from ${before.status}`);
          }
          data = { status: 'DRAFT', decision: null, decidedBy: null, decidedAt: null };
      }

      const after = (await publishGateRepository.updateWithLock(gateId, before.version, data, tx)) as PublishGate;
      await auditRepository.record(
        {
          organizationId: ctx.organizationId,
          tradeId: after.tradeId ?? undefined,
          entityType: 'PublishGate',
          entityId: gateId,
          action: `DECIDE_${input.action.toUpperCase()}`,
          actorId: ctx.actorId,
          actorRole: ctx.actorRole,
          source: 'compliance',
          beforeState: snapshot(before),
          afterState: snapshot(after),
          correlationId,
          ip: ctx.ip ?? undefined,
        },
        tx,
      );
      await outboxRepository.enqueue(
        {
          organizationId: ctx.organizationId,
          tradeId: after.tradeId ?? null,
          eventType: `PUBLISH_GATE_${input.action.toUpperCase()}`,
          payload: { gateId, status: after.status, reason: input.reason ?? null, actorId: ctx.actorId } as Prisma.InputJsonValue,
          correlationId,
          sequence: 0,
        },
        tx,
      );
      return after;
    });
    await flushOutbox();
    return result;
  },

  // ── Reads ────────────────────────────────────────────────────────────────────
  async getGate(ctx: ActorContext, id: string): Promise<PublishGate> {
    const gate = await publishGateRepository.findScopedById(id, ctx.organizationId);
    if (!gate) throw new NotFoundError('PublishGate', id);
    return gate;
  },

  listGates(ctx: ActorContext, filter: PublishGateFilter, page: { page: number; pageSize: number }) {
    return publishGateRepository.listScoped(ctx.organizationId, filter, page);
  },

  getHistory(_ctx: ActorContext, id: string): Promise<AuditLog[]> {
    return auditRepository.listByEntity('PublishGate', id);
  },
};
