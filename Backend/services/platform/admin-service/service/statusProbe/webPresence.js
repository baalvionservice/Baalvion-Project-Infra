'use strict';
/**
 * Web-presence checks — the silent failures that cost a property its traffic without ever
 * showing up as "down".
 *
 * A site can return 200 for months while being invisible to search: a stray noindex, a canonical
 * naming a different (or non-existent) host, a sitemap of URLs that all redirect, a robots.txt
 * that blocks everything. None of that is visible to an uptime check, and all of it was found on
 * this estate the first time these ran.
 *
 * Deliberately slower than the uptime probe (see SEO_MIN_INTERVAL_MS): each run fetches the page,
 * robots.txt and a sitemap. Hammering that every minute would be rude to our own edge and would
 * tell us nothing new — these values change on deploy, not on the minute.
 */
const TIMEOUT_MS = Number(process.env.PROBE_TIMEOUT_MS || 5000);
const UA = 'Mozilla/5.0 (compatible; BaalvionStatusProbe/1.0; +https://admin.baalvion.com)';

async function fetchText(url, { method = 'GET' } = {}) {
    try {
        const res = await fetch(url, {
            method,
            headers: { 'User-Agent': UA },
            redirect: 'follow',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        return { ok: true, status: res.status, url: res.url, headers: res.headers, body: method === 'HEAD' ? '' : await res.text() };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

/**
 * Parse robots.txt into agent groups.
 *
 * This MUST be group-aware. Scanning the whole file with one regex for "User-agent: * … Disallow: /"
 * matches lazily across group boundaries and reports the Cloudflare AI-crawler block (GPTBot,
 * ClaudeBot, Google-Extended et al. each correctly `Disallow: /`) as "this site blocks Google".
 * That exact mistake produced six false criticals on this estate before this parser existed.
 */
function parseRobots(text) {
    const groups = [];
    let cur = null;
    for (const raw of String(text).split(/\r?\n/)) {
        const line = raw.replace(/#.*$/, '').trim();
        if (!line) continue;
        const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
        if (!m) continue;
        const key = m[1].toLowerCase();
        const value = m[2].trim();
        if (key === 'user-agent') {
            // Consecutive User-agent lines share one group; a rule line closes it.
            if (!cur || cur.rules.length) { cur = { agents: [], rules: [] }; groups.push(cur); }
            cur.agents.push(value.toLowerCase());
        } else if (cur && (key === 'allow' || key === 'disallow')) {
            cur.rules.push({ type: key, path: value });
        }
    }
    const sitemaps = [...String(text).matchAll(/^\s*Sitemap:\s*(\S+)/gim)].map((x) => x[1]);
    const star = groups.find((g) => g.agents.includes('*')) || null;
    const blocksEveryone = Boolean(
        star
        && star.rules.some((r) => r.type === 'disallow' && r.path === '/')
        && !star.rules.some((r) => r.type === 'allow' && r.path === '/'),
    );
    const aiCrawlersBlocked = groups
        .filter((g) => !g.agents.includes('*') && g.rules.some((r) => r.type === 'disallow' && r.path === '/'))
        .flatMap((g) => g.agents);
    return { groups, star, sitemaps, blocksEveryone, aiCrawlersBlocked };
}

const check = (id, label, ok, severity, detail) => ({ id, label, ok, severity, detail });

/**
 * @returns {{status: string, checks: Array, summary: object}}
 */
async function inspectSite({ domain, siteId }) {
    const checks = [];
    const page = await fetchText(`https://${domain}/`);
    if (!page.ok) {
        return {
            status: 'down',
            checks: [check('reachable', 'Page loads', false, 'critical', page.error)],
            summary: { domain, error: page.error },
        };
    }

    const servedHost = (() => { try { return new URL(page.url).hostname; } catch { return domain; } })();
    const redirected = servedHost !== domain ? servedHost : null;
    checks.push(check('reachable', 'Page loads', page.status < 400, page.status < 400 ? 'info' : 'critical', `HTTP ${page.status}`));

    // ── Indexability ─────────────────────────────────────────────────────────
    const metaNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(page.body);
    const headerRobots = page.headers.get('x-robots-tag') || '';
    const headerNoindex = /noindex/i.test(headerRobots);
    checks.push(check(
        'indexable', 'Search engines may index it',
        !metaNoindex && !headerNoindex, 'critical',
        metaNoindex ? 'page carries meta robots noindex'
            : headerNoindex ? `X-Robots-Tag: ${headerRobots}`
                : 'no noindex',
    ));

    // ── Canonical ────────────────────────────────────────────────────────────
    // The highest-value check here. A canonical naming another host tells search engines this
    // page is a duplicate of that host — the fastest way to lose a whole property's rankings.
    const canonical = page.body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] || null;
    let canonicalOk = false;
    let canonicalDetail;
    if (!canonical) {
        canonicalDetail = 'no canonical link on the page';
    } else {
        let canonicalHost = null;
        try { canonicalHost = new URL(canonical).hostname; } catch { /* relative or malformed */ }
        if (!canonicalHost) canonicalDetail = `canonical is not an absolute URL: ${canonical}`;
        else if (canonicalHost === servedHost) { canonicalOk = true; canonicalDetail = canonical; }
        else canonicalDetail = `canonical names ${canonicalHost} but the page is served from ${servedHost}`;
    }
    checks.push(check('canonical', 'Canonical URL matches the served host', canonicalOk,
        canonical && !canonicalOk ? 'critical' : 'warning', canonicalDetail));

    checks.push(check('title', 'Has a <title>', /<title[^>]*>\s*\S/i.test(page.body), 'warning',
        page.body.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || 'missing'));

    // ── robots.txt ───────────────────────────────────────────────────────────
    const rob = await fetchText(`https://${domain}/robots.txt`);
    let robots = null;
    if (!rob.ok || rob.status >= 400) {
        checks.push(check('robots', 'robots.txt served', false, 'warning', rob.ok ? `HTTP ${rob.status}` : rob.error));
    } else {
        robots = parseRobots(rob.body);
        checks.push(check('robots', 'robots.txt allows crawling', !robots.blocksEveryone, 'critical',
            robots.blocksEveryone
                ? 'User-agent: * is disallowed from the whole site'
                : `User-agent: * allowed${robots.aiCrawlersBlocked.length ? ` · ${robots.aiCrawlersBlocked.length} AI crawlers blocked` : ''}`));

        // ── Sitemap ──────────────────────────────────────────────────────────
        if (!robots.sitemaps.length) {
            // Not fatal — engines still find /sitemap.xml — but undeclared means slower discovery,
            // which matters most on the properties with the most pages.
            const fallback = await fetchText(`https://${domain}/sitemap.xml`, { method: 'HEAD' });
            const exists = fallback.ok && fallback.status < 400;
            checks.push(check('sitemap', 'Sitemap declared in robots.txt', false, 'warning',
                exists ? '/sitemap.xml exists but robots.txt does not declare it' : 'no sitemap declared and /sitemap.xml not found'));
        } else {
            const first = await fetchText(robots.sitemaps[0], { method: 'HEAD' });
            const ok = first.ok && first.status < 400;
            checks.push(check('sitemap', 'Declared sitemap is reachable', ok, ok ? 'info' : 'critical',
                ok ? robots.sitemaps[0] : `${robots.sitemaps[0]} → ${first.ok ? `HTTP ${first.status}` : first.error}`));
        }
    }

    // ── Redirect shape ───────────────────────────────────────────────────────
    // Not a fault on its own; it becomes one when the canonical or sitemap names the host that
    // redirects rather than the one that serves.
    if (redirected) {
        checks.push(check('redirect', 'Redirect target', true, 'info', `${domain} → ${redirected}`));
    }

    const worst = checks.some((c) => !c.ok && c.severity === 'critical') ? 'down'
        : checks.some((c) => !c.ok && c.severity === 'warning') ? 'degraded'
            : 'up';

    return {
        status: worst,
        checks,
        summary: {
            domain,
            siteId,
            servedHost,
            redirectedTo: redirected,
            canonical,
            httpStatus: page.status,
            sitemapsDeclared: robots ? robots.sitemaps.length : null,
            aiCrawlersBlocked: robots ? robots.aiCrawlersBlocked.length : null,
        },
    };
}

module.exports = { inspectSite, parseRobots };
