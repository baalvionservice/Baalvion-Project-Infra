/**
 * The canonical Baalvion site registry.
 *
 * One entry per property, one stable `id` that every money row, event and ledger line carries.
 * This file supersedes four partial registries that had drifted apart:
 *   - auth-service/utils/brandFromOrigin.js      (host -> brand, for email theming)
 *   - notification-service/templates/premium/*   (brand -> domain, for templates)
 *   - admin-service/service/platformRegistryService.js (5 hardcoded platforms + revenue URLs)
 *   - Frontend/about-baalvion-main/src/lib/network.ts (11 curated public entries)
 *
 * Rules for editing:
 *   - `id` is permanent. Renaming one orphans every historical ledger line that carries it.
 *   - `rails` with basis 'confirmed' is the only kind that may authorise a charge.
 *   - Never add a domain here that does not exist. `not_live` is the honest status for a
 *     built-but-unreachable property; a phantom row is worse than an absent one.
 */
import type { Site } from './types';

export const SITES: readonly Site[] = Object.freeze([
  // ── Payment-taking properties (owner-confirmed 2026-09-06) ──────────────────
  {
    id: 'ctm',
    name: 'ControlTheMarket',
    domains: ['controlthemarket.com'],
    // copyrightvideo.controlthemarket.com sits in the old admin registry but a 2026-07-12
    // audit confirmed it exists nowhere in the codebase, so subdomains own nothing here.
    apexOwnsSubdomains: false,
    status: 'live',
    rails: ['razorpay', 'payu', 'bank_transfer'],
    railsBasis: 'confirmed',
    services: ['ctm-service', 'market-service'],
    legalEntity: null,
  },
  {
    id: 'gti',
    name: 'Global Trade Infrastructure',
    domains: ['trade.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    // The high-value property: trade finance, escrow and financed invoices. Card and UPI
    // per-transaction caps will reject these amounts, so bank_transfer (NEFT/RTGS) is the
    // rail that actually carries the large tickets.
    rails: ['razorpay', 'bank_transfer'],
    railsBasis: 'confirmed',
    services: ['trade-service', 'order-execution-service', 'financial-services-java'],
    legalEntity: null,
  },
  {
    id: 'community',
    name: 'Baalvion Communities',
    domains: ['community.marketunderworld.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    // Crypto only. community-service holds no PSP keys and relays to payment-service —
    // the reference implementation of the money plane for every other property.
    rails: ['crypto'],
    railsBasis: 'confirmed',
    services: ['community-service'],
    legalEntity: null,
  },
  {
    id: 'proxy',
    name: 'Proxy BaalvionStack',
    domains: ['proxy.baalvionstack.com'],
    apexOwnsSubdomains: true,
    status: 'live',
    rails: ['razorpay', 'payu', 'bank_transfer'],
    railsBasis: 'confirmed',
    services: ['proxy-service'],
    legalEntity: null,
  },

  // ── Live properties whose rails are inferred from code, not yet confirmed ────
  {
    id: 'amarise',
    name: 'Amarisé Maison Avenue',
    domains: ['amarisemaisonavenue.com', 'www.amarisemaisonavenue.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    // Evidenced by order-service/service/paymentProvider.js, which ships working adapters for
    // all five. Deployed and taking orders, so these are marked rather than blanked — but the
    // basis is code, not a human, and needs confirming before it can authorise a charge.
    rails: ['razorpay', 'stripe', 'payu', 'bank_transfer', 'crypto'],
    railsBasis: 'code',
    services: ['order-service', 'commerce-service', 'inventory-service', 'fulfillment-service'],
    legalEntity: null,
  },

  // ── Live properties with no rails configured ────────────────────────────────
  // Each of these has payments/subscriptions tables in its service but no confirmed rail.
  // Charging must fail closed until someone sets them.
  {
    id: 'baalvion',
    name: 'Baalvion',
    domains: ['baalvion.com', 'www.baalvion.com'],
    // Every *.baalvion.com subdomain is a distinct product (jobs != trade != mining), so the
    // apex owns none of them.
    apexOwnsSubdomains: false,
    status: 'live',
    rails: [],
    railsBasis: 'none',
    services: ['about-service', 'cms-service'],
    legalEntity: null,
  },
  {
    id: 'law',
    name: 'Law Elite Network',
    domains: ['lawelitenetwork.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    // law-service ships a complete Razorpay integration (service/razorpay.js: order creation,
    // signature verification, webhook secret resolution) and the frontend's /checkout/[bookingId]
    // opens Razorpay Checkout against it. Consultation bookings are charged here today, so the
    // site must declare the rail or the spine refuses its own captures.
    rails: ['razorpay'],
    railsBasis: 'code',
    services: ['law-service', 'law-elite'],
    legalEntity: null,
  },
  {
    id: 'imperialpedia',
    name: 'Imperialpedia',
    domains: ['imperialpedia.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    rails: [],
    railsBasis: 'none',
    services: ['imperialpedia-service', 'cms-service'],
    legalEntity: null,
  },
  {
    id: 'ir',
    name: 'Baalvion Investor Relations',
    domains: ['ir.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    rails: [],
    railsBasis: 'none',
    services: ['ir-service', 'cms-service'],
    legalEntity: null,
  },
  {
    id: 'insiders',
    name: 'Baalvion Insiders',
    domains: ['marketunderworld.com'],
    // community.marketunderworld.com is its own site above, so the apex must NOT claim
    // subdomains. auth-service currently suffix-matches this apex — see the note in README.
    apexOwnsSubdomains: false,
    status: 'live',
    // Elite Circle membership. insiders-service holds no PSP keys — it relays to the JVM
    // payment-service, so the rails here are the providers that service can settle on, minus
    // Stripe (no Stripe account on this estate).
    rails: ['razorpay', 'payu', 'cashfree', 'crypto'],
    railsBasis: 'code',
    services: ['insiders-service'],
    legalEntity: null,
  },
  {
    id: 'jobs',
    name: 'TalentOS',
    domains: ['jobs.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    rails: [],
    railsBasis: 'none',
    services: ['jobs-service'],
    legalEntity: null,
  },
  {
    id: 'ships',
    name: 'World Shipping Directory',
    domains: ['ships.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    rails: [],
    railsBasis: 'none',
    services: ['trade-service'],
    legalEntity: null,
  },
  {
    id: 'signal',
    name: 'Baalvion Intelligence',
    domains: ['signal.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    // The 2026-07-12 audit checked news-service and concluded there was no revenue source. It
    // had the wrong service: baalvion-intelligence's /api/billing/* routes proxy to
    // DEVELOPER_SERVICE_URL, and developer-service ships a live Razorpay billing integration
    // (services/razorpayBillingService.js) that its /pricing page opens a checkout against.
    rails: ['razorpay'],
    railsBasis: 'code',
    services: ['developer-service', 'news-service'],
    legalEntity: null,
  },
  {
    id: 'about',
    name: 'About Baalvion',
    domains: ['about.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'live',
    rails: [],
    railsBasis: 'none',
    services: ['about-service', 'cms-service'],
    legalEntity: null,
  },

  // ── Internal control plane ──────────────────────────────────────────────────
  {
    id: 'admin',
    name: 'Baalvion Admin',
    domains: ['admin.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'internal',
    rails: [],
    railsBasis: 'none',
    services: ['admin-service', 'dashboard-service', 'tenant-service', 'rbac-service'],
    legalEntity: null,
  },

  // ── Built, not serving ──────────────────────────────────────────────────────
  // Statuses taken from NOT_YET_LIVE_DOMAINS in about-baalvion's network.ts, which is
  // DNS/HTTP-checked before every edit.
  {
    id: 'mining',
    name: 'Baalvion Mining',
    domains: ['mining.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'not_live',
    rails: [],
    railsBasis: 'none',
    services: ['mining-service', 'cms-service'],
    legalEntity: null,
  },
  {
    id: 'connect',
    name: 'Baalvion Connect',
    domains: ['connect.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'not_live',
    rails: [],
    railsBasis: 'none',
    services: ['brand-connector-service'],
    legalEntity: null,
  },
  {
    id: 'dashboard',
    name: 'Company Unified Dashboard',
    domains: ['dashboard.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'not_live',
    rails: [],
    railsBasis: 'none',
    services: ['dashboard-service'],
    legalEntity: null,
  },
  {
    id: 'help',
    name: 'Baalvion Help Center',
    domains: ['help.baalvion.com'],
    apexOwnsSubdomains: false,
    status: 'not_live',
    rails: [],
    railsBasis: 'none',
    services: ['cms-service'],
    legalEntity: null,
  },
]);

/**
 * Hosts that serve machinery, not a property. Resolution returns null for these rather than
 * falling through to a wrong site — an API host must never be attributed revenue.
 */
export const INFRASTRUCTURE_HOSTS: readonly string[] = Object.freeze([
  'api.baalvion.com',
  'auth.baalvion.com',
  'auth-api.baalvion.com',
  'developer-api.baalvion.com',
  'files.baalvion.com',
  'metrics.baalvion.com',
  'status.baalvion.com',
  'news.baalvion.com',
  'app.baalvion.com',
  'meet.baalvion.com',        // only in jobs-service seed data + an interview mock
  'signals.baalvion.com',     // a feed URL inside news-service, not a property
  'imperialpedia.baalvion.com', // appears only in Search Console config; alias of the apex
]);

/**
 * Hosts found in code that are neither a known site nor known infrastructure. Listed so the
 * next pass does not have to rediscover them, and so `siteForHost` can say "unclassified"
 * instead of silently returning null.
 */
export const UNCLASSIFIED_HOSTS: readonly string[] = Object.freeze([
  'market.baalvion.com', // referenced by baalvion.com's own content + search index
]);
