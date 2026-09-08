'use strict';
/**
 * Builds the probe target list by joining the two registries that already exist.
 *
 *   @baalvion/sites   site -> domains[] + services[] + rails[]   (19 properties)
 *   @baalvion/catalog service -> port, container, health path    (the C8-enforced address book)
 *
 * Nothing here is hand-maintained. Add a service to the catalog and it gets probed; add it to
 * a site's `services` and it starts counting toward that site's rollup. That is the whole point:
 * one person cannot keep a separate monitoring config in sync with reality.
 */
const INTERNAL_HOST = process.env.PROBE_INTERNAL_HOST || 'localhost';
// Web-presence values change on deploy, not by the minute, and each check costs three requests
// against our own edge. Hourly by default.
const SEO_MIN_INTERVAL_MS = Number(process.env.SEO_CHECK_INTERVAL_MS || 3600000);

function loadCatalog() {
    // Resolved through the declared @baalvion/catalog dependency only. A relative path up into
    // the catalog directory would work locally and fails contract rule C2 — services do not read
    // each other's files. Optional at runtime: a container built with `turbo prune` may not carry
    // the catalog, and an empty map degrades the console to "catalog unavailable" — which is
    // honest — rather than crashing the service that hosts the admin API.
    try { return require('@baalvion/catalog/index.json').runtime || {}; }
    catch { return {}; }
}

function loadSites() {
    try { return require('@baalvion/sites').allSites(); }
    catch { return []; }
}

/**
 * Where to probe a service's health from inside the box. In production every service runs
 * behind a container hostname; on a dev box they are all on localhost. PROBE_INTERNAL_HOST
 * switches between the two without a code change.
 */
function internalUrl(rt) {
    const host = INTERNAL_HOST === 'container' ? rt.container : INTERNAL_HOST;
    return `http://${host}:${rt.port}${rt.healthPath || '/health'}`;
}

function buildTargets() {
    const catalog = loadCatalog();
    const sites = loadSites();

    // service name -> the sites that depend on it. A service backing two properties makes both
    // of them red when it dies, which is exactly what a per-site rollup has to show.
    const sitesByService = new Map();
    for (const site of sites) {
        for (const svc of site.services || []) {
            if (!sitesByService.has(svc)) sitesByService.set(svc, []);
            sitesByService.get(svc).push(site.id);
        }
    }

    const targets = [];

    // ── Services ─────────────────────────────────────────────────────────────
    for (const [name, rt] of Object.entries(catalog)) {
        if (rt.deployment === 'not-deployed') {
            targets.push({
                id: `service:${name}`, kind: 'service', name, siteIds: sitesByService.get(name) || [],
                probe: 'none', tier: rt.tier, lifecycle: rt.lifecycle, deployment: rt.deployment,
            });
            continue;
        }
        targets.push({
            id: `service:${name}`, kind: 'service', name,
            siteIds: sitesByService.get(name) || [],
            probe: 'http', url: internalUrl(rt), edgeUrl: rt.publicHealthUrl || null,
            tier: rt.tier, lifecycle: rt.lifecycle, deployment: rt.deployment,
            container: rt.container, port: rt.port,
        });
    }

    // ── Websites ─────────────────────────────────────────────────────────────
    // Probed over the public internet against the canonical domain, because that is the only
    // vantage point that sees DNS, TLS, the CDN and the origin the way a visitor does. An
    // internal probe cannot see a stale Cloudflare edge serving a broken page.
    for (const site of sites) {
        if (site.status !== 'live') continue;
        const domain = (site.domains || [])[0];
        if (!domain) continue;
        targets.push({
            id: `website:${site.id}`, kind: 'website', name: site.name, siteIds: [site.id],
            probe: 'website', url: `https://${domain}`, domain,
        });
    }

    // ── Web presence (SEO), per live site ────────────────────────────────────
    // Separate from the website uptime probe because it answers a different question — "can this
    // property be found" rather than "is it serving" — and because it is far more expensive, so
    // it runs on its own slower cadence.
    for (const site of sites) {
        if (site.status !== 'live') continue;
        const domain = (site.domains || [])[0];
        if (!domain) continue;
        targets.push({
            id: `seo:${site.id}`, kind: 'seo', name: `${site.name} findability`, siteIds: [site.id],
            probe: 'seo', domain, minIntervalMs: SEO_MIN_INTERVAL_MS,
        });
    }

    // ── Datastores ───────────────────────────────────────────────────────────
    // Declared by the catalog rather than assumed: probe what services actually depend on.
    const stores = new Set();
    for (const rt of Object.values(catalog)) {
        if (rt.deployment === 'not-deployed') continue;
        for (const d of rt.datastores || []) stores.add(d);
    }
    for (const store of stores) {
        if (store !== 'postgres' && store !== 'redis') continue;   // the two this service can reach
        targets.push({ id: `datastore:${store}`, kind: 'datastore', name: store, siteIds: [], probe: store });
    }

    // ── Auth, per site ───────────────────────────────────────────────────────
    // One target per property, not one for auth-service: "auth-service is up" and "login works
    // on lawelitenetwork.com" are different facts, and it is the second one that matters.
    for (const site of sites) {
        if (site.status !== 'live') continue;
        targets.push({
            id: `auth:${site.id}`, kind: 'auth', name: `${site.name} sign-in`, siteIds: [site.id],
            probe: 'auth', domain: (site.domains || [])[0],
        });
    }

    // ── Money, per payment-taking site ───────────────────────────────────────
    // Only sites with rails. A property with no rails has no payments to be broken, so it
    // reports "no rails" and never contributes a red pill.
    for (const site of sites) {
        if (!(site.rails || []).length) continue;
        targets.push({
            id: `money:${site.id}`, kind: 'money', name: `${site.name} payments`, siteIds: [site.id],
            probe: 'money', rails: site.rails, railsBasis: site.railsBasis,
        });
    }

    return targets;
}

module.exports = { buildTargets, loadSites, loadCatalog };
