/**
 * The deterministic decision function — the heart of the PCL.
 *
 * `decide(currentState, event)` is a PURE function: no I/O, no clock, no randomness.
 * Given the same `(state, event)` it always returns the same `Decision`, which is what
 * makes the whole layer replay-safe and unit-testable in isolation. `PaymentStateMachine.apply`
 * is just transactional plumbing around this function.
 *
 * The three outcomes encode every safety rule the platform needs:
 *   • apply    — a legal forward transition; mutate state and emit side-effect(s).
 *   • noop     — a duplicate / stale / non-advancing event; ignore it SAFELY (no mutation,
 *                no side effect). This is how out-of-order webhooks converge.
 *   • conflict — an event that *contradicts* a terminal state (e.g. "captured" after
 *                "failed", or "failed" after "settled"). We NEVER auto-flip a terminal
 *                state — that is exactly where double-charge / lost-payment bugs live.
 *                Instead we surface it as an alert so reconciliation/ops converge it.
 */
import {
  type PaymentState,
  isTerminal,
  rankOf,
} from './states';
import { type PaymentEvent, intentOf, targetStateOf } from './events';

export type PaymentEffect =
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_SETTLED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CONFLICT';

export type Decision =
  | { action: 'apply'; to: PaymentState; emit: PaymentEffect[]; reason: string }
  | { action: 'noop'; reason: string }
  | { action: 'conflict'; emit: PaymentEffect[]; reason: string };

const EFFECT_FOR_STATE: Record<PaymentState, PaymentEffect | null> = {
  INITIATED: null, // arriving at INITIATED is bookkeeping, not a downstream-visible effect
  AUTHORIZED: 'PAYMENT_AUTHORIZED',
  CAPTURED: 'PAYMENT_CAPTURED',
  SETTLED: 'PAYMENT_SETTLED',
  FAILED: 'PAYMENT_FAILED',
};

function emitFor(state: PaymentState): PaymentEffect[] {
  const eff = EFFECT_FOR_STATE[state];
  return eff ? [eff] : [];
}

/**
 * A terminal state plus an incoming target that genuinely *contradicts* it (not merely a
 * stale duplicate). Contradictions are surfaced; stale duplicates are silently ignored.
 *   • FAILED  + success(AUTHORIZED|CAPTURED|SETTLED) → contradiction (possible double-charge signal)
 *   • SETTLED + FAILED                               → contradiction (we moved money, now told it failed)
 *   • SETTLED + CAPTURED|AUTHORIZED                  → NOT a contradiction (just an old duplicate)
 */
function isContradiction(current: PaymentState, target: PaymentState): boolean {
  if (current === 'FAILED') {
    return target === 'AUTHORIZED' || target === 'CAPTURED' || target === 'SETTLED';
  }
  if (current === 'SETTLED') {
    return target === 'FAILED';
  }
  return false;
}

export function decide(current: PaymentState, event: PaymentEvent): Decision {
  const intent = intentOf(event);
  const target = targetStateOf(event);

  // 1. Terminal states are immutable. Re-deliveries no-op; contradictions are surfaced.
  if (isTerminal(current)) {
    if (target === current) {
      return { action: 'noop', reason: `duplicate ${event.type} on terminal ${current}` };
    }
    if (isContradiction(current, target)) {
      return {
        action: 'conflict',
        emit: ['PAYMENT_CONFLICT'],
        reason: `event ${event.type}->${target} contradicts terminal ${current}`,
      };
    }
    return { action: 'noop', reason: `stale ${event.type} after terminal ${current}` };
  }

  // 2. Failure from any pre-capture state is always allowed (no money has moved yet).
  //    A FAIL arriving after CAPTURED is unreachable here — CAPTURED is non-terminal but
  //    its rank (2) is above AUTHORIZED, so we still gate it through the rank check below.
  if (intent === 'FAIL') {
    if (current === 'CAPTURED') {
      // We already captured; a late "failed" must not wipe a real payment. Surface it.
      return {
        action: 'conflict',
        emit: ['PAYMENT_CONFLICT'],
        reason: `failure ${event.type} arrived after CAPTURED`,
      };
    }
    return { action: 'apply', to: 'FAILED', emit: ['PAYMENT_FAILED'], reason: `${event.type} from ${current}` };
  }

  // 3. Success ladder: apply only if the event advances rank. Same-or-lower rank means a
  //    duplicate or an out-of-order/stale event — ignore it safely.
  const currentRank = rankOf(current);
  const targetRank = rankOf(target);
  if (currentRank === null || targetRank === null) {
    // Defensive: success intents always map to ranked targets; FAILED handled above.
    return { action: 'noop', reason: `unrankable transition ${current}->${target}` };
  }
  if (targetRank > currentRank) {
    return { action: 'apply', to: target, emit: emitFor(target), reason: `${event.type}: ${current}->${target}` };
  }
  return { action: 'noop', reason: `non-advancing ${event.type}: ${current} already >= ${target}` };
}
