'use strict';

// Route-wiring + no-duplicate-external-call tests for POST /ai/full-editorial-audit (Prompt 4).
// Mirrors the static-source wiring check style already used for /ai/originality-check and
// /ai/verify-claims. No DB, no network, no Express app boot required.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('POST /ai/full-editorial-audit is wired behind authMiddleware', () => {
    const source = fs.readFileSync(path.join(__dirname, '../routes/aiRoutes.js'), 'utf8');
    const line = source.split('\n').find((l) => l.includes("'/full-editorial-audit'"));
    assert.ok(line, 'full-editorial-audit route not found');
    assert.match(line, /authMiddleware/);
});

test('the controller source still exports fullEditorialAudit alongside every existing action (no accidental removal)', () => {
    // Source-level check (not a `require`) — aiController.js pulls in models/index.js, which
    // needs a full app-config environment (JWT_PUBLIC_KEY etc.) to boot, same reason the other
    // route-wiring tests in this suite read routes/aiRoutes.js as text rather than requiring it.
    const source = fs.readFileSync(path.join(__dirname, '../controller/aiController.js'), 'utf8');
    const exportsLine = source.split('\n').find((l) => l.startsWith('module.exports'));
    assert.ok(exportsLine);
    for (const name of ['status', 'assetSummary', 'articleAnalysis', 'originalityCheck', 'verifyClaims', 'fullEditorialAudit']) {
        assert.match(exportsLine, new RegExp(`\\b${name}\\b`), `${name} should still be exported`);
    }
});

test('aiController.js never imports originalityProvider.analyzeOriginality or claimResearchProvider.researchClaims into the audit path directly (source-level guard against a duplicate external call)', () => {
    const source = fs.readFileSync(path.join(__dirname, '../controller/aiController.js'), 'utf8');
    const auditFnMatch = /const fullEditorialAudit = async[\s\S]*?\n};/.exec(source);
    assert.ok(auditFnMatch, 'fullEditorialAudit function body not found');
    const body = auditFnMatch[0];
    assert.doesNotMatch(body, /originalityProvider\.analyzeOriginality/);
    assert.doesNotMatch(body, /claimResearchProvider\.researchClaims/);
});
