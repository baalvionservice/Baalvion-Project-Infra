'use strict';

/**
 * ERP / accounting export. Turns invoices (+ provider costs) into balanced
 * double-entry JOURNAL ENTRIES and serializes them for QuickBooks / Xero / Zoho /
 * NetSuite / SAP or generic CSV. The journal core is PURE + balance-checked
 * (Σdebits == Σcredits), so exports are correct-by-construction and audit-ready.
 *
 * Chart of accounts (configurable):
 *   1100 Accounts Receivable · 4000 Revenue · 2200 Tax Payable
 *   5000 COGS (provider) · 2100 Accounts Payable (provider)
 */

const db = require('../models');
const crypto = require('crypto');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;

const ACCOUNTS = {
  AR: { code: '1100', name: 'Accounts Receivable' },
  REVENUE: { code: '4000', name: 'Revenue' },
  TAX_PAYABLE: { code: '2200', name: 'Tax Payable' },
  COGS: { code: '5000', name: 'Cost of Goods Sold' },
  AP: { code: '2100', name: 'Accounts Payable' },
};

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

/**
 * PURE. Build double-entry lines for one invoice.
 * DR Accounts Receivable (total); CR Revenue (net); CR Tax Payable (tax).
 */
function invoiceJournal(invoice) {
  const total = round2(invoice.total);
  const tax = round2(invoice.tax || 0);
  const net = round2(total - tax);
  const lines = [
    { date: invoice.issuedAt, account: ACCOUNTS.AR.code, accountName: ACCOUNTS.AR.name, debit: total, credit: 0, memo: `Invoice ${invoice.id} ${invoice.orgId}`, ref: String(invoice.id) },
    { date: invoice.issuedAt, account: ACCOUNTS.REVENUE.code, accountName: ACCOUNTS.REVENUE.name, debit: 0, credit: net, memo: `Revenue ${invoice.id}`, ref: String(invoice.id) },
  ];
  if (tax > 0) lines.push({ date: invoice.issuedAt, account: ACCOUNTS.TAX_PAYABLE.code, accountName: ACCOUNTS.TAX_PAYABLE.name, debit: 0, credit: tax, memo: `Tax ${invoice.id}`, ref: String(invoice.id) });
  return lines;
}

/** PURE. Provider cost accrual: DR COGS; CR Accounts Payable. */
function providerCostJournal({ provider, amount, date, period }) {
  const amt = round2(amount);
  return [
    { date, account: ACCOUNTS.COGS.code, accountName: ACCOUNTS.COGS.name, debit: amt, credit: 0, memo: `Provider COGS ${provider} ${period}`, ref: provider },
    { date, account: ACCOUNTS.AP.code, accountName: ACCOUNTS.AP.name, debit: 0, credit: amt, memo: `Payable ${provider} ${period}`, ref: provider },
  ];
}

/** PURE. Sum debits/credits; entries are valid iff they balance. */
function summarize(lines) {
  const debits = round2(lines.reduce((s, l) => s + Number(l.debit || 0), 0));
  const credits = round2(lines.reduce((s, l) => s + Number(l.credit || 0), 0));
  return { entryCount: lines.length, totalDebits: debits, totalCredits: credits, balanced: Math.abs(debits - credits) < 0.01 };
}

// ── PURE serializers ───────────────────────────────────────────────────────────
function toCsv(lines) {
  const header = 'Date,Account,AccountName,Debit,Credit,Memo,Reference';
  const rows = lines.map((l) => [l.date, l.account, l.accountName, l.debit, l.credit, csvEscape(l.memo), l.ref].join(','));
  return [header, ...rows].join('\n');
}

// QuickBooks .IIF (tab-delimited) — the classic GL import format.
function toQuickbooksIIF(lines) {
  const out = ['!TRNS\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tMEMO', '!SPL\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tMEMO', '!ENDTRNS'];
  for (const l of lines) {
    const amount = l.debit > 0 ? l.debit : -l.credit;
    out.push(`SPL\tGENERAL JOURNAL\t${l.date}\t${l.accountName}\t${amount}\t${l.memo}`);
  }
  return out.join('\n');
}

// Xero / generic precise-journal JSON.
function toJournalJson(lines) {
  return JSON.stringify({ format: 'journal.v1', lines }, null, 2);
}

function csvEscape(s) { const v = String(s ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }

function serialize(system, lines) {
  switch (system) {
    case 'quickbooks': return { contentType: 'text/plain', ext: 'iif', content: toQuickbooksIIF(lines) };
    case 'xero': case 'zoho': case 'netsuite': return { contentType: 'application/json', ext: 'json', content: toJournalJson(lines) };
    case 'sap': case 'csv': default: return { contentType: 'text/csv', ext: 'csv', content: toCsv(lines) };
  }
}

// ── async: build + record an export for a period ────────────────────────────────
async function exportPeriod({ system = 'csv', periodStart, periodEnd, exportedBy }) {
  const invoices = await db.sequelize.query(
    `SELECT id, org_id AS "orgId", total, tax, issued_at AS "issuedAt" FROM invoices
     WHERE issued_at >= :s AND issued_at < :e AND status IN ('paid','pending') ORDER BY issued_at`,
    { replacements: { s: periodStart, e: periodEnd }, type: Q.SELECT },
  ).catch(() => []);

  let lines = [];
  for (const inv of invoices) lines = lines.concat(invoiceJournal({ ...inv, issuedAt: toDate(inv.issuedAt) }));

  // Provider cost accruals for the period.
  const providerCosts = await db.sequelize.query(
    `SELECT entity_id AS provider, provider_cost AS amount FROM cost_attributions
     WHERE scope = 'provider' AND period_start = :ps`,
    { replacements: { ps: toDate(periodStart) }, type: Q.SELECT },
  ).catch(() => []);
  for (const pc of providerCosts) {
    if (Number(pc.amount) > 0) lines = lines.concat(providerCostJournal({ provider: pc.provider, amount: Number(pc.amount), date: toDate(periodStart), period: `${toDate(periodStart)}` }));
  }

  const summary = summarize(lines);
  const file = serialize(system, lines);
  const checksum = crypto.createHash('sha256').update(file.content).digest('hex');

  await db.sequelize.query(
    `INSERT INTO erp_exports (system, period_start, period_end, format, entry_count, total_debits, total_credits, checksum, exported_by)
     VALUES (:sys, :ps, :pe, :fmt, :n, :dr, :cr, :sum, :by)`,
    { replacements: { sys: system, ps: toDate(periodStart), pe: toDate(periodEnd), fmt: file.ext, n: summary.entryCount, dr: summary.totalDebits, cr: summary.totalCredits, sum: checksum, by: exportedBy || null }, type: Q.INSERT },
  ).catch((e) => logger.error('[erp] record:', e.message));

  return { system, ...summary, checksum, contentType: file.contentType, filename: `baalvion-${system}-${toDate(periodStart)}.${file.ext}`, content: file.content };
}

function toDate(d) { return (d instanceof Date ? d : new Date(d)).toISOString().slice(0, 10); }

module.exports = { ACCOUNTS, invoiceJournal, providerCostJournal, summarize, toCsv, toQuickbooksIIF, toJournalJson, serialize, exportPeriod };
