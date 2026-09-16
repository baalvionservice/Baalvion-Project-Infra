'use strict';
/**
 * Wikidata Query Service client for the shipping-directory ingest.
 *
 * WDQS fails quietly rather than loudly — a query that exceeds the 32 MiB response
 * ceiling comes back as JSON truncated mid-string, which parses as a SyntaxError that a
 * naive catch logs and swallows, silently dropping the whole batch. So every call here
 * distinguishes "truncated/failed" from "returned zero rows", and callers are expected
 * to reconcile counts afterwards instead of trusting that a loop ran.
 */
const ENDPOINT = 'https://query.wikidata.org/sparql';
const UA = 'BaalvionGTI-ShippingDirectory/1.0 (https://baalvion.com; contact: infra@baalvion.com) node-fetch';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class TruncatedResponse extends Error {}

async function runQuery(sparql, { attempts = 4, label = 'query' } = {}) {
    let lastErr;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(sparql)}`, {
                headers: { Accept: 'application/sparql-results+json', 'User-Agent': UA },
            });
            if (res.status === 429) {
                const wait = Number(res.headers.get('retry-after') || 30) * 1000;
                console.warn(`  [wdqs] 429 on ${label}, waiting ${wait / 1000}s`);
                await sleep(wait);
                continue;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);

            const body = await res.text();
            let json;
            try {
                json = JSON.parse(body);
            } catch (e) {
                // The 32 MiB ceiling: a valid-looking 200 whose body just stops.
                throw new TruncatedResponse(`${e.message} (body ${body.length}B)`);
            }
            return json.results.bindings;
        } catch (err) {
            lastErr = err;
            const backoff = 2000 * attempt * attempt;
            console.warn(`  [wdqs] ${label} attempt ${attempt}/${attempts} failed: ${err.message.slice(0, 140)}`);
            if (attempt < attempts) await sleep(backoff);
        }
    }
    const err = new Error(`[wdqs] ${label} exhausted ${attempts} attempts: ${lastErr && lastErr.message}`);
    err.truncated = lastErr instanceof TruncatedResponse;
    throw err;
}

/** `?x` binding -> "Q42"; anything else -> null. */
const qid = (b, key) => {
    const v = b[key] && b[key].value;
    if (!v) return null;
    const m = /\/entity\/(Q\d+)$/.exec(v);
    return m ? m[1] : null;
};

const str = (b, key) => (b[key] && b[key].value) || null;

const num = (b, key) => {
    const v = b[key] && b[key].value;
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

/** Year out of an xsd:dateTime, rejecting the placeholder/garbage ends of the range. */
const year = (b, key) => {
    const v = b[key] && b[key].value;
    if (!v) return null;
    const m = /^(-?\d{1,4})-/.exec(v);
    if (!m) return null;
    const y = Number(m[1]);
    return y >= 1500 && y <= new Date().getFullYear() + 10 ? y : null;
};

module.exports = { runQuery, qid, str, num, year, sleep, TruncatedResponse };
