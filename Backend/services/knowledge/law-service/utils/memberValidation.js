'use strict';
// Mirrors ENTITY_TYPES in the frontend's types/entity-tagging.ts.
const ENTITY_TYPES = ['person', 'entertainment', 'legal-case', 'court', 'sports-team', 'sports-competition', 'country', 'topic'];
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,199}$/;

const MAX_FOLLOWS = 500;
const MAX_SAVED = 500;

const isEntityType = (v) => typeof v === 'string' && ENTITY_TYPES.includes(v);
const isSlug = (v) => typeof v === 'string' && SLUG_RE.test(v);

module.exports = { ENTITY_TYPES, MAX_FOLLOWS, MAX_SAVED, isEntityType, isSlug };
