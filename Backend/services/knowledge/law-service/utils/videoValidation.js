'use strict';
const { AppError } = require('./errors');

const SCOPES = ['national', 'international'];
const fail = (msg) => { throw new AppError('VALIDATION_ERROR', msg, 400); };
const isHttps = (v) => { try { return new URL(String(v)).protocol === 'https:'; } catch { return false; } };
const blank = (v) => v === undefined || v === null || String(v).trim() === '';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function common(data, isCreate, requiredText) {
    if (isCreate || 'slug' in data) { if (!SLUG.test(String(data.slug || ''))) fail('slug must be lowercase letters, numbers and hyphens'); }
    for (const f of requiredText) if ((isCreate || f in data) && blank(data[f])) fail(`${f} is required`);
    if ('scope' in data && !SCOPES.includes(data.scope)) fail(`scope must be one of ${SCOPES.join(', ')}`);
    if ('country_code' in data && !blank(data.country_code) && !/^[A-Z]{2}$/.test(String(data.country_code))) fail('country_code must be a two-letter code');
    if (data.scope === 'international') data.country_code = null;
}

function validateVideoShow(data, isCreate) {
    common(data, isCreate, ['name']);
    for (const f of ['cover_url']) if (!blank(data[f]) && !isHttps(data[f])) fail(`${f} must be a full https:// address`);
    if (!blank(data.cover_url) && blank(data.cover_credit)) fail('cover_credit is required when a cover image is set');
    if ('faq' in data && (!Array.isArray(data.faq) || data.faq.some((f) => !f || blank(f.q) || blank(f.a)))) fail('each FAQ needs a question and an answer');
    if ('facts' in data && (!Array.isArray(data.facts) || data.facts.some((f) => !f || blank(f.label) || blank(f.value)))) fail('each fact needs a label and a value');
    if ('sources' in data && (!Array.isArray(data.sources) || data.sources.some((x) => !x || blank(x.label) || !isHttps(x.url)))) fail('each source needs a label and a full https:// address');
    if ('seasons' in data) {
        const ss = data.seasons;
        if (!Array.isArray(ss) || ss.length > 80) fail('seasons must be a list of at most 80');
        for (const x of ss) {
            if (!x || !Number.isInteger(Number(x.number))) fail('each season needs a number');
            if (x.participants !== undefined && (!Array.isArray(x.participants) || x.participants.length > 120 || x.participants.some((p) => !p || blank(p.name)))) fail('each participant needs a name');
            if (!blank(x.source) && !isHttps(x.source)) fail('a season source must be a full https:// address');
        }
    }
    if (data.indexable === true && data.overview !== undefined && String(data.overview).trim().split(/\s+/).length < 80) fail('write at least about 80 words of overview before making the page indexable');
}

function validateVideoItem(data, isCreate) {
    common(data, isCreate, ['title', 'video_url']);
    for (const f of ['video_url', 'thumbnail_url']) if (!blank(data[f]) && !isHttps(data[f])) fail(`${f} must be a full https:// address`);
    if (!blank(data.thumbnail_url) && blank(data.thumbnail_credit)) fail('thumbnail_credit is required when a thumbnail is set');
    if ('duration_seconds' in data && data.duration_seconds != null && data.duration_seconds !== '' && !(Number.isInteger(Number(data.duration_seconds)) && Number(data.duration_seconds) >= 0)) fail('duration_seconds must be a whole number');
    if ('people_slugs' in data && !Array.isArray(data.people_slugs)) fail('people_slugs must be a list');
}

module.exports = { SCOPES, validateVideoShow, validateVideoItem };

function validatePodcastShow(data, isCreate) {
    common(data, isCreate, ['title']);
    for (const f of ['listen_url', 'website_url', 'cover_url']) if (!blank(data[f]) && !isHttps(data[f])) fail(`${f} must be a full https:// address`);
    if (!blank(data.cover_url) && blank(data.cover_credit)) fail('cover_credit is required when a cover image is set');
    if ('rank' in data && data.rank != null && data.rank !== '' && !(Number.isInteger(Number(data.rank)) && Number(data.rank) >= 1 && Number(data.rank) <= 100)) fail('rank must be a whole number from 1 to 100 (position within its country)');
    if (data.rank === '') data.rank = null;
    if ('faq' in data) {
        if (!Array.isArray(data.faq) || data.faq.some((f) => !f || blank(f.q) || blank(f.a))) fail('each FAQ needs a question and an answer');
        if (data.faq.length > 12) fail('at most 12 FAQ entries');
    }
    if ('sources' in data) {
        if (!Array.isArray(data.sources) || data.sources.some((x) => !x || blank(x.label) || !isHttps(x.url))) fail('each source needs a label and a full https:// address');
    }
    if ('listen_links' in data) {
        if (!Array.isArray(data.listen_links) || data.listen_links.some((x) => !x || blank(x.label) || !isHttps(x.url))) fail('each listening link needs a label and a full https:// address');
        if (data.listen_links.length > 12) fail('at most 12 listening links');
    }
    if ('hosts' in data) {
        if (!Array.isArray(data.hosts) || data.hosts.some((h) => !h || blank(h.name))) fail('each host needs a name');
        if (data.hosts.some((h) => h.person_slug && !SLUG.test(String(h.person_slug)))) fail('a host person_slug must be a web address slug');
    }
    if ('related_article_slugs' in data && (!Array.isArray(data.related_article_slugs) || data.related_article_slugs.some((x) => !SLUG.test(String(x))))) fail('related_article_slugs must be a list of article slugs');
    if ('videos' in data) {
        if (!Array.isArray(data.videos) || data.videos.some((v) => !v || blank(v.title) || !isHttps(v.url))) fail('each video needs a title and a full https:// address');
        if (data.videos.some((v) => !blank(v.thumbnail_url) && (!isHttps(v.thumbnail_url) || blank(v.thumbnail_credit)))) fail('a video thumbnail needs an https:// address and a credit');
        if (data.videos.length > 30) fail('at most 30 videos');
    }
    if ('episodes' in data) {
        if (!Array.isArray(data.episodes) || data.episodes.some((e) => !e || blank(e.title) || !isHttps(e.url))) fail('each episode needs a title and a full https:// address');
        if (data.episodes.length > 20) fail('at most 20 episodes');
    }
    if ('seo_description' in data && String(data.seo_description || '').length > 320) fail('seo_description is too long');
    if (data.indexable === true && (data.overview === undefined ? false : String(data.overview).trim().split(/\s+/).length < 80)) fail('write at least about 80 words of overview before making the page indexable');
}
module.exports.validatePodcastShow = validatePodcastShow;
