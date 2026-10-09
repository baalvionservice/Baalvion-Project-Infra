'use strict';
// zod's .url() accepts any scheme, including javascript: and data:. Several of these links are
// rendered as clickable anchors in the admin console, so only http(s) is ever allowed.
const { z } = require('zod');

const httpUrl = (max = 600) => z.string().trim().max(max).url().refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) link');
const optionalHttpUrl = (max = 600) => httpUrl(max).optional().or(z.literal('').transform(() => undefined));

module.exports = { httpUrl, optionalHttpUrl };
