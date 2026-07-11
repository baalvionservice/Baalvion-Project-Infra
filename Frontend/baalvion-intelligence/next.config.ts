import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const isDev = process.env.NODE_ENV !== "production";

// auth-service's own public surface (consumer social login: Google/Facebook/Discord).
// Same-origin proxy keeps the OAuth refresh cookie first-party to signal.baalvion.com —
// see auth-service/controller/oauthController.js ("Amarisé reaches this directly via
// its /auth-bff/* rewrite to auth-service /v1/auth/*").
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "https://auth-api.baalvion.com";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self'${isDev ? " ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*" : ""}`,
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [{ source: "/auth-bff/:path*", destination: `${AUTH_SERVICE_URL}/v1/auth/:path*` }];
  },
};

export default nextConfig;
