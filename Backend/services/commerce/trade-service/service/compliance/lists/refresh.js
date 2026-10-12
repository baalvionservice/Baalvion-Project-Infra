'use strict';
/**
 * Download the official sanctions lists and load them into the compliance engine.
 * Shared by the command-line script (scripts/import-sanctions-lists.js) and the
 * recurring queue job (queue/workers.js) so both behave identically.
 */
const https = require('https');

const SOURCES = Object.freeze({
    OFAC: 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.XML',
    UN: 'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
    // The token is the publisher's own public, documented one for anonymous access.
    EU: 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw',
});
const MAX_BYTES = 200 * 1024 * 1024;
const TIMEOUT_MS = 180000;

function download(url, redirects = 5) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: TIMEOUT_MS, headers: { 'User-Agent': 'baalvion-compliance-import/1.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
                res.resume();
                return resolve(download(new URL(res.headers.location, url).toString(), redirects - 1));
            }
            if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode} from ${url}`)); }
            const declared = Number(res.headers['content-length']) || null;
            const chunks = [];
            let got = 0;
            res.on('data', (c) => {
                got += c.length;
                if (got > MAX_BYTES) { req.destroy(new Error(`response exceeded ${MAX_BYTES} bytes`)); return; }
                chunks.push(c);
            });
            res.on('end', () => {
                // A short body with a Content-Length is a dropped connection, not a smaller list.
                if (declared != null && got !== declared) return reject(new Error(`truncated download: got ${got} of ${declared} bytes`));
                resolve(Buffer.concat(chunks).toString('utf8'));
            });
            res.on('error', reject);
        });
        req.on('timeout', () => req.destroy(new Error('download timed out')));
        req.on('error', reject);
    });
}


/**
 * Refresh the given lists (default: all). Never throws for one bad list — it carries
 * on with the rest and reports every outcome, so a broken EU feed does not leave
 * OFAC stale. The caller decides what a failure means (exit code, job failure).
 */
async function refreshLists({ sources = Object.keys(SOURCES), force = false, sequelize = require('../../../models').sequelize } = {}) {
    const { importList } = require('./importer');
    const results = [];
    for (const source of sources) {
        const url = SOURCES[source];
        if (!url) { results.push({ source, status: 'failed', error: `unknown list '${source}'` }); continue; }
        try {
            const xml = await download(url);
            results.push(await importList({ sequelize, source, xml, sourceUrl: url, force }));
        } catch (err) {
            results.push({ source, status: err.name === 'ImportRefused' ? 'refused' : 'failed', error: err.message });
        }
    }
    const changed = results.some((r) => r.status === 'succeeded');
    if (changed) {
        const engine = require('../complianceEngine');
        if (engine.invalidateReferenceData) await engine.invalidateReferenceData();
    }
    return results;
}

const isFailure = (r) => r.status === 'failed' || r.status === 'refused';

module.exports = { SOURCES, download, refreshLists, isFailure };
