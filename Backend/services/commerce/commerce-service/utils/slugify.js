'use strict';
const slugify = (text) =>
    text.toString().toLowerCase().trim()
        .replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');

module.exports = { slugify };
