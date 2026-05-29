const express = require('express');
const router = express.Router();

const entriesController = require('../controllers/entriesController');
const statementsController = require('../controllers/statementsController');

/**
 * POST /v1/ledger/entries
 * Post a new journal entry (debit/credit pair)
 */
router.post('/ledger/entries', entriesController.postEntry);

/**
 * GET /v1/ledger/entries/:id
 * Get a specific journal entry
 */
router.get('/ledger/entries/:id', entriesController.getEntry);

/**
 * GET /v1/ledger/entries
 * Query journal entries with filters
 */
router.get('/ledger/entries', entriesController.listEntries);

/**
 * POST /v1/ledger/entries/:id/reverse
 * Reverse a journal entry
 */
router.post('/ledger/entries/:id/reverse', entriesController.reverseEntry);

/**
 * GET /v1/ledger/accounts/:accountId/statement
 * Get account statement (paginated transaction history)
 */
router.get('/ledger/accounts/:accountId/statement', statementsController.getStatement);

/**
 * GET /v1/ledger/accounts/:accountId/balance
 * Get current balance for an account
 */
router.get('/ledger/accounts/:accountId/balance', statementsController.getBalance);

module.exports = router;
