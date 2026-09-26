'use strict';
/*
 * Shared date-spreading logic — extracted 2026-09-23 from
 * destagger-imperialpedia-publish-dates.cjs so any future one-off
 * bulk-publish script can prevent the clustering problem at publish time
 * instead of needing a cleanup pass afterward.
 *
 * Background: Imperialpedia's articles were bulk-published in batches (21
 * Creator Economy articles, 18 Stocks+Budgeting articles, etc.), and every
 * article in a batch got the SAME publishedAt because the workflow "publish"
 * transition always stamps the server's current time — an obvious bulk/bot-
 * import signature that reads badly to an AdSense reviewer or Search
 * Console's indexing history. Fixed once retroactively (see
 * destagger-imperialpedia-publish-dates.cjs); this module is the reusable
 * piece so a NEW batch never creates the problem in the first place.
 *
 * USAGE for a new bulk-publish script:
 *   const { spreadDates } = require('./lib/staggerPublishDates.cjs');
 *   const dates = spreadDates(startDate, endDate, articles.length);
 *   // then pass dates[i].toISOString() as `publishedAt` on each article's
 *   // publish-transition call (see workflowSchemas.js's transitionSchema,
 *   // which accepts an optional publishedAt override for exactly this).
 *
 * A single editor publishing one real article at a time throughout the day
 * should NOT use this — that's normal, non-clustered activity, and its real
 * "now" timestamp is correct. This is only for scripts publishing several
 * items in one run.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateOnly(input) {
  const d = input instanceof Date ? input : new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Evenly spreads `count` dates across [startDate, endDate] (both Date,
 * UTC-midnight), strictly increasing, never past `endDate`. With count=1,
 * returns [startDate]. Safe for count > the number of days in the window —
 * excess dates compress toward the end rather than exceeding it.
 */
function spreadDates(startDate, endDate, count) {
  const totalDays = Math.round((endDate - startDate) / DAY_MS);
  const assigned = [];
  for (let i = 0; i < count; i++) {
    const frac = count > 1 ? i / (count - 1) : 0;
    const offset = Math.round(frac * totalDays);
    assigned.push(new Date(startDate.getTime() + offset * DAY_MS));
  }
  for (let i = 1; i < assigned.length; i++) {
    if (assigned[i] <= assigned[i - 1]) assigned[i] = new Date(assigned[i - 1].getTime() + DAY_MS);
  }
  const overflow = assigned[assigned.length - 1] - endDate;
  if (overflow > 0) {
    for (let i = 0; i < assigned.length; i++) assigned[i] = new Date(assigned[i].getTime() - overflow);
  }
  return assigned;
}

module.exports = { spreadDates, toDateOnly, fmtDate, DAY_MS };
