'use strict';
const { AppError } = require('./errors');
const { SLUG_RE } = require('./peopleValidation');

// Mirrors ENTERTAINMENT_TYPES in the site's types/entertainment.ts.
const TYPES = ['movie', 'tv-show', 'streaming-show', 'music-release', 'album', 'song', 'award', 'event'];

const fail = (msg) => { throw new AppError('VALIDATION_ERROR', msg, 400); };
const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const https = (v) => /^https:\/\/[^\s]+$/i.test(String(v || ''));

const checkArray = (data, key, label, rowCheck) => {
    if (!(key in data)) return;
    if (!Array.isArray(data[key])) fail(`${label} must be a list`);
    if (data[key].length > 200) fail(`${label} has too many rows`);
    data[key].forEach((row, i) => rowCheck(row, `${label} row ${i + 1}`));
};

const credit = (r, w) => {
    if (!r || !SLUG_RE.test(String(r.personSlug || ''))) fail(`${w}: person slug is required`);
    if (!isText(r.role, 120)) fail(`${w}: role is required`);
    if (r.character != null && r.character !== '' && !isText(r.character, 200)) fail(`${w}: character is too long`);
};
const related = (r, w) => {
    if (!r || !SLUG_RE.test(String(r.slug || ''))) fail(`${w}: slug is required`);
};
// Video and interview entries are links out (or YouTube/Vimeo embeds): never uploaded files, never non-https.
const media = (r, w) => {
    if (!r || !isText(r.title, 300)) fail(`${w}: title is required`);
    if (!https(r.url)) fail(`${w}: link must be an https URL`);
    if (r.thumbnailUrl && !https(r.thumbnailUrl)) fail(`${w}: thumbnail must be an https URL`);
    if (r.publishedAt && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(r.publishedAt))) fail(`${w}: date must be YYYY, YYYY-MM or YYYY-MM-DD`);
};

function validateEntertainment(data, isCreate) {
    if (isCreate || 'slug' in data) if (!SLUG_RE.test(String(data.slug || ''))) fail('slug must be lowercase words separated by hyphens');
    if (isCreate || 'title' in data) if (!isText(data.title, 400)) fail('title is required');
    if (isCreate || 'type' in data) if (!TYPES.includes(data.type)) fail(`type must be one of ${TYPES.join(', ')}`);
    if (data.release_date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(data.release_date)) fail('release date must be YYYY, YYYY-MM or YYYY-MM-DD');
    checkArray(data, 'people_involved', 'credits', credit);
    checkArray(data, 'related_entities', 'related entries', related);
    checkArray(data, 'videos', 'videos', media);
    checkArray(data, 'interviews', 'interviews', media);
    checkArray(data, 'related_article_slugs', 'related articles', (s, w) => { if (!SLUG_RE.test(String(s))) fail(`${w}: not a valid slug`); });
    if (data.indexable === true && data.published === false) fail('an unpublished entry cannot be indexable');
}

module.exports = { TYPES, validateEntertainment };
