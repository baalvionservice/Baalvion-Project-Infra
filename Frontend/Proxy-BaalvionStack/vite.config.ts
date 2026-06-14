import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Same-origin auth proxy target. In production the SPA's static host (e.g. nginx) MUST reverse-proxy
// /auth-bff → this gateway path so the httpOnly refresh cookie flows same-origin.
const AUTH_PROXY = process.env.VITE_AUTH_PROXY_TARGET || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
const authUrl = new URL(AUTH_PROXY);

// CSP connect-src must list the API ORIGIN (not a path-scoped URL, which browsers
// match by exact path). Derive the origin from the configured base URLs so local dev
// (http://localhost:4000) and prod both work without hand-editing the policy.
const toOrigin = (value: string | undefined, fallback: string) => {
  try { return new URL(value || fallback).origin; } catch { return fallback; }
};
const PLATFORM_ORIGIN = toOrigin(process.env.VITE_API_PLATFORM_BASE_URL, 'https://api.baalvion.com');
const AUTH_ORIGIN = toOrigin(process.env.VITE_API_AUTH_BASE_URL, 'https://api.baalvion.com');

// Same-origin auth proxy — forward /auth-bff/* to the auth gateway so the httpOnly cookie is set
// against localhost:8080 and flows on every request. No CORS, no cross-site cookies. Shared by the
// dev server and the production `vite preview` server.
const authBffProxy = {
  '/auth-bff': {
    target: authUrl.origin,
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/auth-bff/, authUrl.pathname),
  },
};

// Hardened response headers (CSP, framing, sniffing) applied in both dev and production preview.
const securityHeaders = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://placehold.co https://images.unsplash.com",
    "font-src 'self' data:",
    `connect-src 'self' ${AUTH_ORIGIN} ${PLATFORM_ORIGIN}`,
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '),
};

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    proxy: authBffProxy,
    headers: securityHeaders,
  },
  // Production: `vite preview` serves the optimized dist/ build with the same port, proxy, and
  // hardened headers as dev so proxy.baalvionstack.com behaves identically in production.
  preview: {
    host: "::",
    port: 8080,
    strictPort: true,
    proxy: authBffProxy,
    headers: securityHeaders,
    // Vite blocks unrecognised Host headers. Behind the local reverse proxy / Caddy the
    // upstream Host is proxy.baalvionstack.com (or .local), so it must be allow-listed or
    // preview returns "Blocked request. This host is not allowed."
    allowedHosts: [".baalvionstack.com", ".baalvionstack.local", "localhost"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
