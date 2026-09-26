'use strict';
const { AppError } = require('./errors');
const { SLUG_RE } = require('./peopleValidation');

// Mirrors COMPETITION_LEVELS in the site's types/sports.ts.
const COMPETITION_LEVELS = ['olympic', 'championship', 'tournament', 'league', 'other'];

const fail = (msg) => { throw new AppError('VALIDATION_ERROR', msg, 400); };
const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const https = (v) => /^https:\/\/[^\s]+$/i.test(String(v || ''));
const countryOk = (v) => v == null || v === '' || /^[A-Z]{2}$/.test(v);

const checkArray = (data, key, label, rowCheck) => {
    if (!(key in data)) return;
    if (!Array.isArray(data[key])) fail(`${label} must be a list`);
    if (data[key].length > 200) fail(`${label} has too many rows`);
    data[key].forEach((row, i) => rowCheck(row, `${label} row ${i + 1}`));
};

const participant = (r, w) => {
    if (!r || !SLUG_RE.test(String(r.personSlug || ''))) fail(`${w}: person slug is required`);
    if (!isText(r.role, 120)) fail(`${w}: role is required`);
    if (r.result != null && r.result !== '' && !isText(r.result, 200)) fail(`${w}: result is too long`);
};
const media = (r, w) => {
    if (!r || !isText(r.title, 300)) fail(`${w}: title is required`);
    if (!https(r.url)) fail(`${w}: link must be an https URL`);
    if (r.publishedAt && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(String(r.publishedAt))) fail(`${w}: date must be YYYY, YYYY-MM or YYYY-MM-DD`);
};

function validateTeam(data, isCreate) {
    if (isCreate || 'slug' in data) if (!SLUG_RE.test(String(data.slug || ''))) fail('slug must be lowercase words separated by hyphens');
    if (isCreate || 'name' in data) if (!isText(data.name, 300)) fail('name is required');
    if ('sport' in data && !isText(data.sport, 100)) fail('sport is required');
    if (!countryOk(data.country_code)) fail('country_code must be a 2-letter ISO code');
    if (data.url && !https(data.url)) fail('url must be an https URL');
    if (data.indexable === true && data.published === false) fail('an unpublished team cannot be indexable');
}

function validateCompetition(data, isCreate) {
    if (isCreate || 'slug' in data) if (!SLUG_RE.test(String(data.slug || ''))) fail('slug must be lowercase words separated by hyphens');
    if (isCreate || 'name' in data) if (!isText(data.name, 400)) fail('name is required');
    if ('sport' in data && !isText(data.sport, 100)) fail('sport is required');
    if ('level' in data && !COMPETITION_LEVELS.includes(data.level)) fail(`level must be one of ${COMPETITION_LEVELS.join(', ')}`);
    if (!countryOk(data.country_code)) fail('country_code must be a 2-letter ISO code');
    if (data.event_date && !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(data.event_date)) fail('date must be YYYY, YYYY-MM or YYYY-MM-DD');
    checkArray(data, 'people_involved', 'athletes', participant);
    checkArray(data, 'videos', 'videos', media);
    checkArray(data, 'related_article_slugs', 'related articles', (s, w) => { if (!SLUG_RE.test(String(s))) fail(`${w}: not a valid slug`); });
    if (data.indexable === true && data.published === false) fail('an unpublished competition cannot be indexable');
}

/** An athlete's sport, position and team (a team slug ties them to a team page). */
function validateSportsInfo(info) {
    if (info == null) return;
    if (typeof info !== 'object' || Array.isArray(info)) fail('sports info must be an object');
    if (Object.keys(info).length === 0) return;
    if (!isText(info.sport, 100)) fail('sports info: sport is required');
    if (info.position != null && info.position !== '' && !isText(info.position, 100)) fail('sports info: position is too long');
    if (info.teamSlug != null && info.teamSlug !== '' && !SLUG_RE.test(String(info.teamSlug))) fail('sports info: team slug is not valid');
    if (info.team != null && info.team !== '' && !isText(info.team, 200)) fail('sports info: team name is too long');
}

module.exports = { COMPETITION_LEVELS, validateTeam, validateCompetition, validateSportsInfo };
