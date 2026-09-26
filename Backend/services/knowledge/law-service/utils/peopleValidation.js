'use strict';
const { AppError } = require('./errors');

// Mirrors PERSON_CATEGORIES in the frontend's types/person.ts.
const CATEGORIES = ['actors', 'musicians', 'directors', 'producers', 'tv-personalities', 'influencers', 'creators', 'athletes', 'lawyers', 'judges', 'other'];
const STATUSES = ['active', 'retired', 'inactive', 'deceased'];
const LINK_KINDS = ['topic', 'article', 'person', 'entertainment', 'legal-case', 'court', 'sports-team', 'sports-competition', 'country'];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Photos may only be shown under a licence that permits it. Anything
// non-commercial or no-derivatives is refused, as is a missing licence.
const LICENSE_OK = [/^CC0\b/i, /^Public domain\b/i, /^PD\b/i, /^CC BY(-SA)?( \d\.\d)?\b/i, /^LEN-owned$/i, /^Licensed$/i];
const LICENSE_BAD = /\b(NC|ND)\b/i;

const isAllowedLicense = (v) => typeof v === 'string' && LICENSE_OK.some((re) => re.test(v.trim())) && !LICENSE_BAD.test(v);

const fail = (msg) => { throw new AppError('VALIDATION_ERROR', msg, 400); };

function validatePerson(data, isCreate) {
    if ('sports_info' in data) require('./sportsValidation').validateSportsInfo(data.sports_info);
    if (isCreate || 'slug' in data) if (!SLUG_RE.test(String(data.slug || '')) || data.slug.length > 200) fail('slug must be lowercase words separated by hyphens');
    if (isCreate || 'full_name' in data) if (!String(data.full_name || '').trim()) fail('full_name is required');
    if (isCreate || 'category' in data) if (!CATEGORIES.includes(data.category)) fail(`category must be one of ${CATEGORIES.join(', ')}`);
    if ('status' in data && !STATUSES.includes(data.status)) fail(`status must be one of ${STATUSES.join(', ')}`);
    if (data.country_code != null && data.country_code !== '' && !/^[A-Z]{2}$/.test(data.country_code)) fail('country_code must be a 2-letter ISO code');
    if (data.official_website && !/^https:\/\//i.test(data.official_website)) fail('official_website must be an https URL');
    // Indexing a page is a promise that it has real depth; require it to be published and reviewed.
    if (data.indexable === true && data.published === false) fail('an unpublished profile cannot be indexable');
}

function validatePhoto(data) {
    if ('license' in data && !isAllowedLicense(data.license)) fail('license must be public domain, CC0, CC BY, CC BY-SA, LEN-owned or Licensed (no NC/ND)');
    if ('credit' in data && !String(data.credit || '').trim()) fail('credit is required');
}

function validateLink(data, isCreate) {
    if (isCreate || 'kind' in data) if (!LINK_KINDS.includes(data.kind)) fail(`kind must be one of ${LINK_KINDS.join(', ')}`);
    if (isCreate || 'target_slug' in data) if (!SLUG_RE.test(String(data.target_slug || '')) && !/^[A-Z]{2}$/.test(String(data.target_slug || ''))) fail('target_slug is not a valid slug');
}

module.exports = { CATEGORIES, STATUSES, LINK_KINDS, SLUG_RE, isAllowedLicense, validatePerson, validatePhoto, validateLink };
