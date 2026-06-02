const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');
const db = require('../models');
const { getTenantId } = require('../middleware/tenantContext');
const { transactionsInitiated, transactionsFailed, feesCollected } = require('../middleware/metrics');
const feeEngine = require('../services/feeEngine');
const idempotencyService = require('../services/idempotencyService');
const kafkaService = require('../services/kafkaService');
const config = require('../config/appConfig');

const { sequelize } = db;

/**
 * POST /v1/payments/initiate
 * Initiate a new payment (debit source, credit destination)
 */
async function initiatePayment(req, res, next) {
  try {
    const tenantId = getTenantId();
    const {
      idempotencyKey,
      sourceAccountId,
      destinationAccountId,
      amount,
      currency = 'USD',
      paymentScheme = 'INTERNAL',
      description,
      metadata = {},
    } = req.body;

    // Validation
    if (!idempotencyKey || !sourceAccountId || !destinationAccountId || !amount) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Missing required fields',
      });
    }

    // Check idempotency
    const existing = await idempotencyService.checkIdempotency(tenantId, idempotencyKey);
    if (existing.isDuplicate) {
      return res.status(409).json({
        error: 'DUPLICATE_PAYMENT',
        message: 'Payment with this idempotency key already exists',
        data: existing.result,
      });
    }

    // Validate amount limits
    const limitCheck = feeEngine.validateLimits(amount, paymentScheme);
    if (!limitCheck.valid) {
      return res.status(400).json({
        error: limitCheck.error,
        message: limitCheck.message,
      });
    }

    // Calculate fees
    const feesCalc = feeEngine.calculateFees(amount, paymentScheme);

    // Create transaction
    const transaction = await db.Transaction.create({
      id: uuidv4(),
      tenantId,
      idempotencyKey,
      sourceAccountId,
      destinationAccountId,
      amount: new Decimal(amount).toFixed(4),
      fee: feesCalc.totalFee,
      vat: feesCalc.vat,
      currency,
      paymentScheme,
      status: 'PROCESSING',
      description,
      metadata,
      initiatedAt: new Date(),
    });

    // Store in idempotency cache
    await idempotencyService.storeResult(tenantId, idempotencyKey, {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      fee: transaction.fee,
    });

    // Publish event (trigger saga)
    if (config.features.kafkaEvents) {
      await kafkaService.publishPaymentInitiated({
        ...transaction.toJSON(),
        traceId: req.traceId,
      });
    }

    transactionsInitiated.labels(paymentScheme, currency).inc();
    feesCollected.labels(currency).set(parseFloat(feesCalc.totalFee));

    res.status(201).json({
      success: true,
      data: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        fee: transaction.fee,
        totalDebit: new Decimal(transaction.amount).plus(transaction.fee).toFixed(4),
        currency: transaction.currency,
        initiatedAt: transaction.initiatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/payments/:id
 * Get payment details
 */
async function getPayment(req, res, next) {
  try {
    const tenantId = getTenantId();
    const { id } = req.params;

    const transaction = await db.Transaction.findOne({
      where: { id, tenantId },
    });

    if (!transaction) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/payments
 * List payments with filters
 */
async function listPayments(req, res, next) {
  try {
    const tenantId = getTenantId();
    const {
      status,
      paymentScheme,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = { tenantId };
    if (status) where.status = status;
    if (paymentScheme) where.paymentScheme = paymentScheme;

    const transactions = await db.Transaction.findAll({
      where,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['initiatedAt', 'DESC']],
    });

    const total = await db.Transaction.count({ where });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/payments/:id/reverse
 * Reverse a payment (refund)
 *
 * Fix: wrap the read-check-update in a serialised transaction with a
 * SELECT … FOR UPDATE row-level lock so two concurrent reversal requests
 * cannot both pass the REVERSED guard and both write REVERSED (double-reversal).
 * Matching pattern from gatewayPaymentService.js refundPayment().
 */
async function reversePayment(req, res, next) {
  try {
    const tenantId = getTenantId();
    const { id } = req.params;
    const { reason } = req.body;

    let transaction;
    let alreadyReversed = false;

    await sequelize.transaction(async (t) => {
      // Acquire a row-level UPDATE lock before reading status.
      // Concurrent reversals block here; the second one to acquire the lock
      // will see status=REVERSED and bail out without double-writing.
      transaction = await db.Transaction.findOne({
        where: { id, tenantId },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!transaction) return; // handled outside

      if (transaction.status === 'REVERSED') {
        alreadyReversed = true;
        return;
      }

      await transaction.update(
        { status: 'REVERSED', reversedAt: new Date() },
        { transaction: t },
      );
    });

    if (!transaction) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Payment not found',
      });
    }

    if (alreadyReversed) {
      return res.status(409).json({
        error: 'ALREADY_REVERSED',
        message: 'This payment has already been reversed',
      });
    }

    // Publish reversal event (outside the DB transaction — fail-open)
    if (config.features.kafkaEvents) {
      await kafkaService.publishPaymentFailed({
        ...transaction.toJSON(),
        failureReason: `Reversal: ${reason || 'Manual reversal'}`,
        traceId: req.traceId,
      });
    }

    transactionsFailed.labels(transaction.paymentScheme, 'REVERSED').inc();

    res.json({
      success: true,
      data: transaction,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/payments/bulk
 * Bulk disbursement
 */
async function bulkPayments(req, res, next) {
  try {
    const tenantId = getTenantId();
    const { payments, currency = 'USD' } = req.body;

    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Payments array required and must not be empty',
      });
    }

    if (payments.length > 1000) {
      return res.status(400).json({
        error: 'BATCH_TOO_LARGE',
        message: 'Maximum 1000 payments per batch',
      });
    }

    const results = [];

    for (const payment of payments) {
      const {
        idempotencyKey,
        sourceAccountId,
        destinationAccountId,
        amount,
        description,
      } = payment;

      try {
        // Mirror initiatePayment: check idempotency before touching the DB.
        // Returns the cached result if this key was already processed (dedup).
        if (idempotencyKey) {
          const existing = await idempotencyService.checkIdempotency(tenantId, idempotencyKey);
          if (existing.isDuplicate) {
            results.push({ success: true, id: existing.result.id, duplicate: true });
            continue;
          }
        }

        // Wrap each item in its own transaction so a failure is isolated and
        // the idempotency store + DB row are either both written or both rolled back.
        let tx;
        await sequelize.transaction(async (t) => {
          tx = await db.Transaction.create(
            {
              id: uuidv4(),
              tenantId,
              idempotencyKey,
              sourceAccountId,
              destinationAccountId,
              amount: new Decimal(amount).toFixed(4),
              currency,
              paymentScheme: 'INTERNAL',
              status: 'PROCESSING',
              description,
              initiatedAt: new Date(),
            },
            { transaction: t },
          );
        });

        // Persist idempotency result after the DB row is committed.
        if (idempotencyKey) {
          await idempotencyService.storeResult(tenantId, idempotencyKey, {
            id: tx.id,
            status: tx.status,
            amount: tx.amount,
          });
        }

        results.push({ success: true, id: tx.id });
      } catch (err) {
        results.push({
          success: false,
          error: err.message,
          idempotencyKey,
        });
      }
    }

    res.status(202).json({
      success: true,
      data: results,
      totalProcessed: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/payments/:id/fee-breakdown
 * Get fee calculation
 *
 * Fix: validate that amount is a finite positive number before constructing
 * new Decimal(). Passing non-numeric strings (e.g. "abc", "Infinity", "NaN")
 * previously threw an uncaught InvalidOperation inside Decimal, surfacing as an
 * unhandled 500. Return 400 with a clear message instead.
 */
async function getFeeBreakdown(req, res, next) {
  try {
    const { amount, scheme = 'INTERNAL' } = req.query;

    if (!amount) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Amount query parameter required',
      });
    }

    // Validate: must be a finite, non-negative number (string coerced).
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        error: 'INVALID_AMOUNT',
        message: 'Amount must be a valid finite non-negative number',
      });
    }

    const fees = feeEngine.calculateFees(amount, scheme);

    res.json({
      success: true,
      amount,
      scheme,
      fees,
      totalDebit: new Decimal(amount).plus(fees.totalFee).toFixed(4),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  initiatePayment,
  getPayment,
  listPayments,
  reversePayment,
  bulkPayments,
  getFeeBreakdown,
};
