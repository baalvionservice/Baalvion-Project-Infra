import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCtmAuthHeader } from "./ctm-auth-header";

test("forwards a present session token as a Bearer Authorization header", () => {
  assert.deepEqual(buildCtmAuthHeader("eyJhbG.real.jwt"), {
    Authorization: "Bearer eyJhbG.real.jwt",
  });
});

test("sends NO Authorization header without a session (anonymous → backend 401)", () => {
  // Each of these means "no logged-in caller", so the request must go out unauthenticated and the
  // authMiddleware-gated endpoints reject it — never silently forwarded as a blank credential.
  assert.deepEqual(buildCtmAuthHeader(undefined), {});
  assert.deepEqual(buildCtmAuthHeader(null), {});
  assert.deepEqual(buildCtmAuthHeader(""), {});
  assert.deepEqual(buildCtmAuthHeader("   "), {});
});
