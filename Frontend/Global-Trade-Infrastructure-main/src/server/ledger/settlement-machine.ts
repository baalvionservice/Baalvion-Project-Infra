/**
 * @file server/ledger/settlement-machine.ts
 * @description The settlement engine's state machine. It defines, for each
 * operator/system action, the legal source states, the resulting state, and the
 * money-custody movement that action implies between the instruction's three
 * accounts (payer → clearing → payee). The service layer drives an instruction
 * by asking this machine "is this action legal from here, and what posting does
 * it imply?" — keeping the transition law in one auditable, testable place.
 *
 * Custody model (all three are balance-bearing accounts; "move" = debit dest /
 * credit source, always balanced):
 *   AUTHORIZE  payer    → clearing   (reserve funds out of the payer)
 *   CAPTURE    (no money moves — confirms intent; funds remain in clearing)
 *   SETTLE     clearing → payee      (finality; supports partial amounts)
 *   FAIL       clearing → payer      (release any still-held funds back)
 *   CANCEL     (no money moves — only legal before authorization)
 *   REVERSE    payee    → payer      (post-settlement refund / chargeback)
 */
import { Money } from './money';
import { PostingLine, transfer } from './posting';
import { SettlementAction, SettlementStatus } from './types';

export class SettlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettlementError';
  }
}

/** The three accounts a settlement instruction moves money between. */
export interface SettlementAccounts {
  payerAccountId: string;
  clearingAccountId: string;
  payeeAccountId: string;
}

/** Running amounts that constrain how much an action may move. */
export interface SettlementAmounts {
  /** Full instruction amount. */
  amount: Money;
  /** Amount already moved to the payee by prior (partial) settlements. */
  settled: Money;
}

interface TransitionSpec {
  /** States from which this action is legal. */
  from: readonly SettlementStatus[];
  /** Resulting state. For SETTLE this may be overridden to a partial state. */
  to: SettlementStatus;
  /** Whether the action carries/consumes a money movement. */
  moves: boolean;
}

const TRANSITIONS: Readonly<Record<SettlementAction, TransitionSpec>> = {
  AUTHORIZE: { from: ['CREATED'], to: 'AUTHORIZED', moves: true },
  CAPTURE: { from: ['AUTHORIZED'], to: 'CAPTURED', moves: false },
  SETTLE: { from: ['CAPTURED', 'PARTIALLY_SETTLED'], to: 'SETTLED', moves: true },
  FAIL: { from: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'PARTIALLY_SETTLED'], to: 'FAILED', moves: true },
  CANCEL: { from: ['CREATED'], to: 'CANCELLED', moves: false },
  REVERSE: { from: ['SETTLED'], to: 'REVERSED', moves: true },
};

export function isLegalAction(from: SettlementStatus, action: SettlementAction): boolean {
  return TRANSITIONS[action].from.includes(from);
}

/** The set of actions legal from a given state (for UIs / API discovery). */
export function legalActions(from: SettlementStatus): SettlementAction[] {
  return (Object.keys(TRANSITIONS) as SettlementAction[]).filter((a) => isLegalAction(from, a));
}

/** The outcome of planning a transition: the next state plus the posting (if any). */
export interface TransitionPlan {
  action: SettlementAction;
  fromStatus: SettlementStatus;
  toStatus: SettlementStatus;
  /** Posting legs to apply atomically, or null when the action moves no money. */
  posting: PostingLine[] | null;
  /** Amount this action moves (zero for non-moving actions). */
  movedAmount: Money;
  /** New cumulative settled amount after this action (for SETTLE bookkeeping). */
  settledAfter: Money;
}

/**
 * Plan a transition: validate legality, resolve partial-settlement bookkeeping,
 * and produce the implied posting. `requestedAmount` is only consulted for
 * SETTLE (partial settlements); other actions move a machine-determined amount.
 * Throws {@link SettlementError} on any illegal or out-of-bounds request.
 */
export function planTransition(
  fromStatus: SettlementStatus,
  action: SettlementAction,
  accounts: SettlementAccounts,
  amounts: SettlementAmounts,
  requestedAmount?: Money,
): TransitionPlan {
  if (!isLegalAction(fromStatus, action)) {
    throw new SettlementError(`ILLEGAL_TRANSITION: ${action} from ${fromStatus}`);
  }

  const currency = amounts.amount.currency;
  const zero = Money.zero(currency);
  const remaining = amounts.amount.subtract(amounts.settled);

  switch (action) {
    case 'AUTHORIZE':
      return done({
        action,
        fromStatus,
        toStatus: 'AUTHORIZED',
        posting: transfer(accounts.payerAccountId, accounts.clearingAccountId, amounts.amount, 'settlement.authorize'),
        movedAmount: amounts.amount,
        settledAfter: amounts.settled,
      });

    case 'CAPTURE':
      return done({
        action,
        fromStatus,
        toStatus: 'CAPTURED',
        posting: null,
        movedAmount: zero,
        settledAfter: amounts.settled,
      });

    case 'SETTLE': {
      const move = requestedAmount ?? remaining;
      if (!move.isPositive()) {
        throw new SettlementError('INVALID_AMOUNT: settlement amount must be positive');
      }
      if (move.gt(remaining)) {
        throw new SettlementError(
          `OVER_SETTLEMENT: ${move.toDecimalString()} exceeds remaining ${remaining.toDecimalString()} ${currency}`,
        );
      }
      const settledAfter = amounts.settled.add(move);
      const toStatus: SettlementStatus = settledAfter.equals(amounts.amount) ? 'SETTLED' : 'PARTIALLY_SETTLED';
      return done({
        action,
        fromStatus,
        toStatus,
        posting: transfer(accounts.clearingAccountId, accounts.payeeAccountId, move, 'settlement.settle'),
        movedAmount: move,
        settledAfter,
      });
    }

    case 'FAIL': {
      // Release whatever is still held in clearing for this instruction back to
      // the payer. Held = authorized amount minus what has already been settled.
      const held = remaining;
      const posting =
        held.isPositive() && fromStatus !== 'CREATED'
          ? transfer(accounts.clearingAccountId, accounts.payerAccountId, held, 'settlement.fail.release')
          : null;
      return done({
        action,
        fromStatus,
        toStatus: 'FAILED',
        posting,
        movedAmount: posting ? held : zero,
        settledAfter: amounts.settled,
      });
    }

    case 'CANCEL':
      return done({
        action,
        fromStatus,
        toStatus: 'CANCELLED',
        posting: null,
        movedAmount: zero,
        settledAfter: amounts.settled,
      });

    case 'REVERSE':
      return done({
        action,
        fromStatus,
        toStatus: 'REVERSED',
        posting: transfer(accounts.payeeAccountId, accounts.payerAccountId, amounts.amount, 'settlement.reverse'),
        movedAmount: amounts.amount,
        settledAfter: zero,
      });

    default:
      throw new SettlementError(`UNKNOWN_ACTION: ${String(action)}`);
  }
}

function done(plan: TransitionPlan): TransitionPlan {
  return plan;
}
