/**
 * @fileOverview Central export point for the (now much smaller) mock-api directory.
 *
 * As of this cleanup, only calculators.ts is re-exported here, and it is NOT
 * fabricated/deceptive data despite the folder name — it's the real, accurate
 * registry of this site's actual working calculator tools (see
 * calculators-service.ts). transparency.ts also remains (imported directly by
 * system-service.ts, not through this barrel) as a real, honest zero-value
 * outage fallback, not fabricated content.
 *
 * Every other file in this directory (analytics, articles, creators, glossary,
 * moderation, premium, search, system, users, audit, content-quality, editorial,
 * roles, topics, user-dashboard, version-control) was deleted in this pass —
 * each was either fully orphaned dead code, or a live fallback that silently
 * presented fabricated data as real (e.g. the creators leaderboard, where every
 * mock entry shared an identical invented $15,400.50 "revenue" figure). See
 * creators-service.ts, system-service.ts, premium-service.ts, search-service.ts,
 * and articles-service.ts for what replaced each one.
 */

export * from './calculators';
