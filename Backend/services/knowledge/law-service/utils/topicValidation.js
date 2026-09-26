'use strict';
const { AppError } = require('./errors');
const { SLUG_RE } = require('./peopleValidation');

// Mirrors Topic['pillar'] in the site's data/topics.ts.
const PILLARS = ['legal', 'entertainment', 'sports', 'general'];
// The site's tagger ignores names shorter than this, so a shorter name or alias would silently never match.
const MIN_MATCH_LENGTH = 4;

const fail = (msg) => { throw new AppError('VALIDATION_ERROR', msg, 400); };

function validateTopic(data, isCreate) {
    if (isCreate || 'slug' in data) if (!SLUG_RE.test(String(data.slug || ''))) fail('slug must be lowercase words separated by hyphens');
    if (isCreate || 'name' in data) {
        const n = String(data.name || '').trim();
        if (n.length < MIN_MATCH_LENGTH || n.length > 200) fail(`name must be ${MIN_MATCH_LENGTH}–200 characters (shorter names are never matched in article text)`);
    }
    if ('pillar' in data && !PILLARS.includes(data.pillar)) fail(`pillar must be one of ${PILLARS.join(', ')}`);
    if ('aliases' in data) {
        if (!Array.isArray(data.aliases) || data.aliases.length > 30) fail('aliases must be a list of up to 30 phrases');
        data.aliases.forEach((a, i) => {
            if (typeof a !== 'string' || a.trim().length < MIN_MATCH_LENGTH || a.length > 100) fail(`alias ${i + 1} must be ${MIN_MATCH_LENGTH}–100 characters`);
        });
    }
    if ('description' in data && String(data.description || '').length > 8000) fail('description is too long');
    if (data.indexable === true && data.published === false) fail('an unpublished topic cannot be indexable');
}

module.exports = { PILLARS, MIN_MATCH_LENGTH, validateTopic };
