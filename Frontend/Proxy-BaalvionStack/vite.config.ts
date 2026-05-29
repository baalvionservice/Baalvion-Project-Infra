import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Same-origin auth proxy target. In production the SPA's static host (e.g. nginx) MUST reverse-proxy
// /auth-bff → this gateway path so the httpOnly refresh cookie flows same-origin.
const AUTH_PROXY = process.env.VITE_AUTH_PROXY_TARGET || 'https://api.baalvion.com/api/v1/identity/auth/v1/auth';
const authUrl = new URL(AUTH_PROXY);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Dev: forward same-origin /auth-bff/* to the auth gateway so the httpOnly cookie is set
      // against localhost:8080 and flows on every request. No CORS, no cross-site cookies.
      '/auth-bff': {
        target: authUrl.origin,
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/auth-bff/, authUrl.pathname),
      },
    },
    headers: {
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
        `connect-src 'self' ${process.env.VITE_API_AUTH_BASE_URL || 'https://api.baalvion.com'} ${process.env.VITE_API_PLATFORM_BASE_URL || 'https://api.baalvion.com'}`,
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ].join('; '),
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
