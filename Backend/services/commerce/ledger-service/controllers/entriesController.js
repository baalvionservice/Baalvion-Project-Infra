const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { getTenantId } = require('../middleware/tenantContext');
const { journalEntriesTotal } = require('../middleware/metrics');
const { auditLedger } = require('../utils/audit');

/**
 * POST /v1/ledger/entries
 * Create a new journal entry (double-entry bookkeeping)
 */
async function postEntry(req, res, next) {
  try {
    const tenantId = getTenantId();
    const {
      transactionRef,
      debitAccountId,
      creditAccountId,
      amount,
      currency = 'USD',
      entryType,
      description,
      relatedTransactionId,
      metadata = {},
    } = req.body;

    // Validation
    if (!transactionRef || !debitAccountId || !creditAccountId || !amount || !entryType) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Missing required fields: transactionRef, debitAccountId, creditAccountId, amount, entryType',
      });
    }

    if (debitAccountId === creditAccountId) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Debit and credit accounts cannot be the same',
      });
    }

    // Check for idempotency (duplicate transaction ref)
    const existingEntry = await db.JournalEntry.findOne({
      where: {
        tenantId,
        transactionRef,
      },
    });

    if (existingEntry) {
      return res.status(409).json({
        error: 'DUPLICATE_TRANSACTION',
        message: 'Entry with this transactionRef already exists',
        id: existingEntry.id,
      });
    }

    // Create the journal entry
    const entry = await db.JournalEntry.create({
      id: uuidv4(),
      tenantId,
      transactionRef,
      debitAccountId,
      creditAccountId,
      amount,
      currency,
      entryType,
      description,
      relatedTransactionId,
      metadata,
      status: 'POSTED',
      postedAt: new Date(),
    });

    journalEntriesTotal.labels(entryType, 'POSTED').inc();

    auditLedger(req, 'ledger.entry.post', {
      entryId: entry.id,
      transactionRef,
      debitAccountId,
      creditAccountId,
      amount,
      currency,
      entryType,
      relatedTransactionId,
    });

    res.status(201).json({
      success: true,
      data: entry,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/ledger/entries/:id
 * Get a specific journal entry
 */
async function getEntry(req, res, next) {
  try {
    const tenantId = getTenantId();
    const { id } = req.params;

    const entry = await db.JournalEntry.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!entry) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Journal entry not found',
      });
    }

    res.json({
      success: true,
      data: entry,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/ledger/entries
 * List journal entries with filters
 */
async function listEntries(req, res, next) {
  try {
    const tenantId = getTenantId();
    const {
      accountId,
      entryType,
      status = 'POSTED',
      limit = 50,
      offset = 0,
    } = req.query;

    const where = { tenantId, status };
    if (accountId) {
      where[require('sequelize').Op.or] = [
        { debitAccountId: accountId },
        { creditAccountId: accountId },
      ];
    }
    if (entryType) where.entryType = entryType;

    const entries = await db.JournalEntry.findAll({
      where,
      limit: Math.min(parseInt(limit), 100),
      offset: parseInt(offset),
      order: [['postedAt', 'DESC']],
    });

    const total = await db.JournalEntry.count({ where });

    res.json({
      success: true,
      data: entries,
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
 * POST /v1/ledger/entries/:id/reverse
 * Reverse a journal entry (create compensating entry)
 */
async function reverseEntry(req, res, next) {
  try {
    const tenantId = getTenantId();
    const { id } = req.params;
    const { reason } = req.body;

    const entry = await db.JournalEntry.findOne({
      where: { id, tenantId },
    });

    if (!entry) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Journal entry not found',
      });
    }

    if (entry.status === 'REVERSED') {
      return res.status(409).json({
        error: 'ALREADY_REVERSED',
        message: 'This entry has already been reversed',
      });
    }

    // Create a compensating (reversing) entry
    const reversingEntry = await db.JournalEntry.create({
      id: uuidv4(),
      tenantId,
      transactionRef: `${entry.transactionRef}-REVERSAL-${Date.now()}`,
      debitAccountId: entry.creditAccountId, // Swap
      creditAccountId: entry.debitAccountId, // Swap
      amount: entry.amount,
      currency: entry.currency,
      entryType: 'REVERSAL',
      description: `Reversal of ${entry.id}. Reason: ${reason || 'Not provided'}`,
      relatedTransactionId: entry.id,
      status: 'POSTED',
      postedAt: new Date(),
    });

    // Mark original as reversed
    await entry.update({
      status: 'REVERSED',
      reversedAt: new Date(),
    });

    journalEntriesTotal.labels('REVERSAL', 'POSTED').inc();

    auditLedger(req, 'ledger.entry.reverse', {
      originalEntryId: entry.id,
      reversingEntryId: reversingEntry.id,
      transactionRef: entry.transactionRef,
      amount: entry.amount,
      currency: entry.currency,
      reason: reason || 'Not provided',
      before: 'POSTED',
      after: 'REVERSED',
    });

    res.status(201).json({
      success: true,
      data: {
        originalEntry: entry,
        reversingEntry,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postEntry,
  getEntry,
  listEntries,
  reverseEntry,
};
