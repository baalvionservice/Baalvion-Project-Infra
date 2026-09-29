"use client";

import type { TokenPair } from "@baalvion/auth-sdk";
import type { AuthSessionOptions } from "@baalvion/auth-sdk";

// In-memory access token only — never localStorage. The httpOnly refresh cookie set by
// auth-service (via /auth-bff, see src/app/auth-bff/[...path]/route.ts) is the durable
// session; this module just holds the short-lived Bearer token for the current page load
// and re-derives it from the cookie on refresh/reload (see AuthProvider's cookieRefresh mode).
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setTokens(tokens: TokenPair): void {
  accessToken = tokens.accessToken;
}

export function clearTokens(): void {
  accessToken = null;
}

export const authSessionOptions: AuthSessionOptions = {
  authUrl: "/auth-bff",
  cookieRefresh: true,
  mePath: "/me",
  getAccessToken,
  setTokens,
  clearTokens,
};
