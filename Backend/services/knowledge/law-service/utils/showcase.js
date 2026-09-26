'use strict';
const { Op } = require('sequelize');
const slugs = require('../data/showcase-people.json');

// Until the site is approved the only people shown, in the admin panel and on
// the site, are the fully-researched ones in data/showcase-people.json. Nothing
// is deleted; LEN_SHOWCASE_ONLY=false lifts the restriction.
const ON = process.env.LEN_SHOWCASE_ONLY !== 'false';
const SLUGS = new Set(slugs);

/** Sequelize condition for entity_photos: person photos only for showcase people; every other entity type is untouched. */
const entityPhotoWhere = () => (ON
    ? { [Op.or]: [{ entity_type: { [Op.ne]: 'person' } }, { entity_slug: { [Op.in]: slugs } }] }
    : {});

module.exports = { ON, SLUGS, entityPhotoWhere };
