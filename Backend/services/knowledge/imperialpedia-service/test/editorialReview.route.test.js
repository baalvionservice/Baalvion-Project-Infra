'use strict';

// Route-wiring + source-level security-invariant tests for the Prompt 5 editorial-review
// endpoints. Same style as fullEditorialAudit.route.test.js: reads source as text rather than
// `require`-ing the controllers, since models/index.js needs a full DB/app-config environment
// to boot (JWT_PUBLIC_KEY etc.) that isn't available in this unit-test run.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const routesSource = fs.readFileSync(path.join(__dirname, '../routes/articlesRoutes.js'), 'utf8');
const controllerSource = fs.readFileSync(path.join(__dirname, '../controller/editorialReviewController.js'), 'utf8');
const articlesControllerSource = fs.readFileSync(path.join(__dirname, '../controller/articlesController.js'), 'utf8');

test('GET /:id/editorial-review is wired behind authMiddleware', () => {
    const line = routesSource.split('\n').find((l) => l.includes("'/:id/editorial-review'"));
    assert.ok(line, 'editorial-review GET route not found');
    assert.match(line, /authMiddleware/);
});

test('POST /:id/editorial-review/approve is wired behind authMiddleware', () => {
    const line = routesSource.split('\n').find((l) => l.includes("/:id/editorial-review/approve"));
    assert.ok(line, 'editorial-review approve route not found');
    assert.match(line, /authMiddleware/);
});

test('GET /:id/editorial-review/history is wired behind authMiddleware', () => {
    const line = routesSource.split('\n').find((l) => l.includes("/:id/editorial-review/history"));
    assert.ok(line, 'editorial-review history route not found');
    assert.match(line, /authMiddleware/);
});

test('editorialReviewController.js still exports getReviewState, getReviewHistory and approveReview', () => {
    const exportsLine = controllerSource.split('\n').find((l) => l.startsWith('module.exports'));
    assert.ok(exportsLine);
    for (const name of ['getReviewState', 'getReviewHistory', 'approveReview']) {
        assert.match(exportsLine, new RegExp(`\\b${name}\\b`), `${name} should be exported`);
    }
});

test('approveReview NEVER reads a reviewer id from req.body — reviewer identity comes only from req.user.id', () => {
    const fnMatch = /const approveReview = async[\s\S]*?\n};/.exec(controllerSource);
    assert.ok(fnMatch, 'approveReview function body not found');
    const body = fnMatch[0];
    assert.doesNotMatch(body, /req\.body\.reviewer/i);
    assert.match(body, /reviewer_user_id:\s*req\.user\.id/);
});

test('approveReview rejects a mismatched fingerprint with 409 STALE_REVIEW before ever creating a review row', () => {
    const fnMatch = /const approveReview = async[\s\S]*?\n};/.exec(controllerSource);
    const body = fnMatch[0];
    const staleIdx = body.indexOf('STALE_REVIEW');
    const createIdx = body.indexOf('.create(');
    assert.ok(staleIdx !== -1, 'STALE_REVIEW guard not found');
    assert.ok(createIdx !== -1, 'review creation not found');
    assert.ok(staleIdx < createIdx, 'fingerprint check must happen before the review row is created');
});

test('approveReview validates input via editorialReviewService.validateApprovalInput (no ad-hoc re-validation)', () => {
    assert.match(controllerSource, /reviewService\.validateApprovalInput\(req\.body\)/);
});

test('publishArticle (articlesController.js) is gated on an APPROVED editorial review before it can set status=published', () => {
    const fnMatch = /const publishArticle = async[\s\S]*?\n};/.exec(articlesControllerSource);
    assert.ok(fnMatch, 'publishArticle function body not found');
    const body = fnMatch[0];
    assert.match(body, /reviewService\.deriveReviewStatus/);
    assert.match(body, /HUMAN_REVIEW_REQUIRED/);

    // The gate must run BEFORE the article is actually flipped to 'published'.
    const gateIdx = body.indexOf('HUMAN_REVIEW_REQUIRED');
    const updateIdx = body.indexOf("status: 'published'");
    assert.ok(gateIdx !== -1 && updateIdx !== -1);
    assert.ok(gateIdx < updateIdx, 'human-review gate must run before the publish update');
});

test('publishArticle recomputes the fingerprint from the DB article row, never trusts a client-supplied fingerprint', () => {
    const fnMatch = /const publishArticle = async[\s\S]*?\n};/.exec(articlesControllerSource);
    const body = fnMatch[0];
    assert.match(body, /contentFingerprint\(article\.title, article\.content\)/);
    assert.doesNotMatch(body, /req\.body\.(reviewedFingerprint|currentFingerprint|fingerprint)/);
});
