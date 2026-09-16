'use strict';
/**
 * World Shipping Directory — public reference routes.
 *
 * No authMiddleware anywhere in this file, deliberately. These endpoints serve the
 * public shipping-directory site and return only openly-licensed reference data about
 * companies and ships; there is no tenant-scoped row behind any of them. Everything is
 * read-only — the registry is filled by scripts/shipping-directory/*, never over HTTP.
 */
const router = require('express').Router();
const c = require('../controller/shippingDirectoryController');

router.get('/stats',      c.getStats);
router.get('/rankings',   c.getRankings);
router.get('/countries',  c.listCountries);
router.get('/countries/:code', c.getCountry);

// Feeds the directory's sitemap index. Paged — the vessel table is past the 50,000-URL
// per-file ceiling on its own.
router.get('/sitemap/:kind', c.listSitemap);

router.get('/companies',              c.listCompanies);
router.get('/companies/:slug',        c.getCompany);
router.get('/companies/:slug/vessels', c.listCompanyVessels);

// Shipbuilder and flag-state hubs. dimension is a fixed path segment, validated in the
// service against a two-value allowlist before it reaches a query.
router.get('/cohorts/:dimension',       c.listCohorts);
router.get('/cohorts/:dimension/:slug', c.getCohort);
// The flag x type cross-cut's slug contains a slash (<flag>/<type>), so it needs its own
// two-segment route rather than riding the single :slug param above.
router.get('/cohorts/flag_type/:flag/:type', c.getCrossCohort);

router.get('/vessels',        c.listShips);
router.get('/vessels/:slug',  c.getShip);

module.exports = router;
