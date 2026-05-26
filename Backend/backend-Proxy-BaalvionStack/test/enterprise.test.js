'use strict';

// Enterprise pure-logic tests — `npm test` (node --test), no DB/Redis.

const { test } = require('node:test');
const assert = require('node:assert');

const rbacService = require('../service/rbacService');
const slaService = require('../service/slaService');
const auditExport = require('../service/auditExportService');

test('rbac: wildcard + exact permission matching', () => {
  assert.ok(rbacService.permissionMatches('*', 'anything.read'));
  assert.ok(rbacService.permissionMatches('proxy.*', 'proxy.sessions.read'));
  assert.ok(rbacService.permissionMatches('proxy.sessions.*', 'proxy.sessions.write'));
  assert.ok(rbacService.permissionMatches('billing.invoices.read', 'billing.invoices.read'));
  assert.ok(!rbacService.permissionMatches('proxy.*', 'billing.invoices.read'));
  assert.ok(!rbacService.permissionMatches('proxy.sessions.read', 'proxy.sessions.write'));
});

test('rbac: hasPermission across a granted set', () => {
  const perms = ['usage.*', 'billing.invoices.read'];
  assert.ok(rbacService.hasPermission(perms, 'usage.geo.read'));
  assert.ok(rbacService.hasPermission(perms, 'billing.invoices.read'));
  assert.ok(!rbacService.hasPermission(perms, 'admin.audit.export'));
});

test('sla: no violation above target → 0 credit', () => {
  const r = slaService.computeCredit(99.95);
  assert.strictEqual(r.violated, false);
  assert.strictEqual(r.creditPct, 0);
});

test('sla: 99.5% uptime → 10% credit (violated)', () => {
  const r = slaService.computeCredit(99.5);
  assert.strictEqual(r.violated, true);
  assert.strictEqual(r.creditPct, 10);
});

test('sla: severe outage → worst-tier credit', () => {
  const r = slaService.computeCredit(94);
  assert.strictEqual(r.creditPct, 50);
});

test('audit export: CSV escapes + header', () => {
  const csv = auditExport.toCsv([{ a: 1, b: 'x,y' }, { a: 2, b: 'q"z' }]);
  const lines = csv.split('\n');
  assert.strictEqual(lines[0], 'a,b');
  assert.strictEqual(lines[1], '1,"x,y"');
  assert.strictEqual(lines[2], '2,"q""z"');
  assert.strictEqual(auditExport.toCsv([]), '');
});
