import { test } from "node:test";
import assert from "node:assert/strict";
import { isProtectedPath, isPublicPath } from "./auth-paths";

test("authenticated dashboard routes are gated (cannot render for anon users)", () => {
  const protectedPaths = [
    "/dashboard",
    // The exact edge-middleware bypass the fix targets: a dotted dynamic segment that the
    // `.*\..*` matcher excluded as a "static asset" and let through unauthenticated.
    "/analytics/domains/example.com",
    "/analytics/domains/sub.example.co.uk",
    "/employees/123",
    "/finance",
    "/finance/reports",
    "/ai/simulator",
    "/payments",
    "/security/audit",
    "/settings/billing/trial-expired",
  ];
  for (const p of protectedPaths) {
    assert.equal(isProtectedPath(p), true, `${p} must be gated`);
    assert.equal(isPublicPath(p), false, `${p} must not be public`);
  }
});

test("genuinely public routes render without authentication", () => {
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/signup",
    "/marketing",
    "/marketing/demo",
    "/install",
    "/docs/help",
  ];
  for (const p of publicPaths) {
    assert.equal(isPublicPath(p), true, `${p} must be public`);
    assert.equal(isProtectedPath(p), false, `${p} must not be gated`);
  }
});

test("a public prefix never leaks to a sibling protected route", () => {
  // Substring-prefix safety: these are NOT public despite sharing a leading prefix.
  assert.equal(isProtectedPath("/authority"), true);
  assert.equal(isProtectedPath("/marketingplaybook"), true);
  assert.equal(isProtectedPath("/installer-secrets"), true);
});
