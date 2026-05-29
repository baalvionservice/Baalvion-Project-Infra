const db = require('../models');
const { getTenantId } = require('../middleware/tenantContext');

/**
 * GET /v1/ledger/accounts/:accountId/statement
 * Get account statement (paginated transaction history)
 */
async function getStatement(req, res, next) {
  try {
    const tenantId = getTenantId();
    const { accountId } = req.params;
    const { limit = 100, offset = 0, startDate, endDate } = req.query;

    const where = {
      tenantId,
      status: 'POSTED',
      [require('sequelize').Op.or]: [
        { debitAccountId: accountId },
        { creditAccountId: accountId },
      ],
    };

    if (startDate || endDate) {
      where.postedAt = {};
      if (startDate) where.postedAt[require('sequelize').Op.gte] = new Date(startDate);
      if (endDate) where.postedAt[require('sequelize').Op.lte] = new Date(endDate);
    }

    const entries = await db.JournalEntry.findAll({
      where,
      limit: Math.min(parseInt(limit), 500),
      offset: parseInt(offset),
      order: [['postedAt', 'DESC']],
    });

    const total = await db.JournalEntry.count({ where });

    // Transform entries into debits/credits from account perspective
    const statement = entries.map((e) => ({
      id: e.id,
      date: e.postedAt,
      type: e.entryType,
      description: e.description,
      debit: e.debitAccountId === accountId ? e.amount : null,
      credit: e.creditAccountId === accountId ? e.amount : null,
      otherParty: e.debitAccountId === accountId ? e.creditAccountId : e.debitAccountId,
      currency: e.currency,
      metadata: e.metadata,
    }));

    res.json({
      success: true,
      accountId,
      statement,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/ledger/accounts/:accountId/balance
 * Get current balance for an account
 */
async function getBalance(req, res, next) {
  try {
    const tenantId = getTenantId();
    const { accountId } = req.params;
    const { currency = 'USD' } = req.query;

    // Get all debits and credits for the account
    const entries = await db.JournalEntry.findAll({
      attributes: ['amount', 'debitAccountId', 'creditAccountId', 'currency'],
      where: {
        tenantId,
        status: 'POSTED',
        currency,
        [require('sequelize').Op.or]: [
          { debitAccountId: accountId },
          { creditAccountId: accountId },
        ],
      },
    });

    // Calculate balance
    let balance = 0;
    entries.forEach((entry) => {
      if (entry.debitAccountId === accountId) {
        balance += parseFloat(entry.amount); // Debit increases balance
      } else {
        balance -= parseFloat(entry.amount); // Credit decreases balance
      }
    });

    res.json({
      success: true,
      accountId,
      currency,
      balance: balance.toFixed(4),
      transactionCount: entries.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStatement,
  getBalance,
};
