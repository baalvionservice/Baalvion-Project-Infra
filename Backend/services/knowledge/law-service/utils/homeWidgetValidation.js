'use strict';
const { AppError } = require('./errors');

// Mirrors HomeWidgetKind in the site's lib/home-widgets.ts. `needs` is what a
// widget cannot render honestly without; e.g. a photo with no credit is refused.
const WIDGETS = {
    breaking: { needs: ['title', 'source_name', 'event_at', 'expires_at'] },
    ticker:   { needs: ['title', 'value'] },
    audio:    { needs: ['title', 'url'] },
    docket:   { needs: ['title', 'url'], extra: ['court', 'status'] },
    gallery:  { needs: ['title', 'image_url', 'credit'] },
    shorts:   { needs: ['title', 'url'] },
};
const KINDS = Object.keys(WIDGETS);
const URL_FIELDS = ['url', 'image_url'];
const MAX_BREAKING_MS = 48 * 3600 * 1000;

const fail = (msg) => { throw new AppError('VALIDATION_ERROR', msg, 400); };
const isHttps = (v) => { try { return new URL(String(v)).protocol === 'https:'; } catch { return false; } };
const blank = (v) => v === undefined || v === null || String(v).trim() === '';

function validateHomeWidgetItem(data, isCreate) {
    if (isCreate && !KINDS.includes(data.widget)) fail(`widget must be one of ${KINDS.join(', ')}`);
    if (!isCreate && 'widget' in data) delete data.widget; // a kind is fixed once created
    if ('title' in data && String(data.title).trim().length > 300) fail('title is too long');
    if ('summary' in data && String(data.summary || '').length > 2000) fail('summary is too long');
    for (const f of URL_FIELDS) if (!blank(data[f]) && !isHttps(data[f])) fail(`${f} must be a full https:// address`);

    if (isCreate) {
        for (const f of WIDGETS[data.widget].needs) if (blank(data[f])) fail(`${f} is required for a ${data.widget} entry`);
        for (const f of WIDGETS[data.widget].extra || []) if (blank(data.extra?.[f])) fail(`${f} is required for a ${data.widget} entry`);
    } else if ('title' in data && blank(data.title)) fail('title cannot be empty');
    if (data.expires_at && data.event_at) {
        const start = new Date(data.event_at).getTime(); const end = new Date(data.expires_at).getTime();
        if (Number.isNaN(start) || Number.isNaN(end)) fail('event_at and expires_at must be valid dates');
        if (end <= start) fail('expires_at must be after event_at');
        if (data.widget === 'breaking' && end - start > MAX_BREAKING_MS) fail('a breaking item can stay up for at most 48 hours');
    }
    if ('region' in data && data.region != null && data.region !== '' && !/^([A-Z]{2}|INTL)$/.test(String(data.region))) fail('region must be a two-letter country code or INTL');
    if ('extra' in data && (typeof data.extra !== 'object' || Array.isArray(data.extra) || data.extra === null)) fail('extra must be an object');
}

module.exports = { WIDGETS, KINDS, validateHomeWidgetItem };
