'use strict';
/**
 * World Shipping Directory — public HTTP surface.
 *
 * Unauthenticated by design: this is the read-only reference directory that backs the
 * public shipping-directory site, built entirely from openly-licensed reference data
 * (Wikidata CC0, plus a dated Alphaliner ranking via Wikipedia). It exposes no tenant
 * data — tradeops.carriers and tradeops.vessels rows created by this ingest carry
 * data_source='wikidata'/'alphaliner-wikipedia' and no customer information.
 *
 * Responses always carry provenance. A fleet figure without its source is not
 * publishable here, because the counted fleet and the company's published fleet differ
 * by an order of magnitude and the reader has to be able to tell which they are looking
 * at (see migration 067).
 */
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const directory = require('../service/shipping-directory/directory');

const listCompanies = async (req, res, next) => {
    try {
        const { q: search, country, alliance, scope, sort, limit, offset } = req.query;
        const result = await directory.listCarriers({ search, country, alliance, scope, sort, limit, offset });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

/**
 * The company page in one call: profile, the fleet we can verify, and the 10-year
 * delivery history. `fleet` and `reported` stay separate objects so a client cannot
 * accidentally render one as the other.
 */
const getCompany = async (req, res, next) => {
    try {
        const carrier = await directory.getCarrier(req.params.slug);
        if (!carrier) return next(new AppError('NOT_FOUND', `No shipping company with slug '${req.params.slug}'`, 404));

        // Related entities that are themselves carriers here get linked; the rest stay as
        // plain names. See resolveRelatedCarriers for why this matters.
        const relatedQids = []
            .concat((carrier.subsidiaries || []).map((o) => o.qid))
            .concat((carrier.owners || []).map((o) => o.qid));

        const [profile, peers, related, context] = await Promise.all([
            directory.getCarrierFleetProfile(carrier.id),
            directory.listPeerCarriers(carrier.id, carrier.country_code),
            directory.resolveRelatedCarriers(relatedQids),
            directory.getCarrierContext(carrier),
        ]);
        return sendSuccess(req, res, {
            company: carrier,
            peers,
            related,
            context,
            registry: {
                ...profile,
                basis: 'counted',
                note: 'Counted from vessels held in this registry. Reference data links only a minority of the world fleet to an operator, so this is a verifiable lower bound, not the company total.',
            },
            reported: carrier.reported_fleet_size == null ? null : {
                fleetSize: carrier.reported_fleet_size,
                teu: carrier.reported_teu,
                marketSharePct: carrier.market_share_pct,
                rank: carrier.capacity_rank,
                source: carrier.reported_source,
                sourceUrl: carrier.reported_source_url,
                asOf: carrier.reported_as_of,
                basis: 'published',
            },
        });
    } catch (err) { return next(err); }
};

const listCompanyVessels = async (req, res, next) => {
    try {
        const carrier = await directory.getCarrier(req.params.slug);
        if (!carrier) return next(new AppError('NOT_FOUND', `No shipping company with slug '${req.params.slug}'`, 404));
        const { type, sort, limit, offset, q: search } = req.query;
        const result = await directory.listCarrierVessels(carrier.id, { type, sort, limit, offset, search });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const listShips = async (req, res, next) => {
    try {
        const { q: search, type, flag, built_from: builtFrom, built_to: builtTo, carrier, sort, limit, offset } = req.query;
        const result = await directory.listVessels({
            search, type, flag, builtFrom, builtTo, carrierSlug: carrier, sort, limit, offset,
        });
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const getShip = async (req, res, next) => {
    try {
        const result = await directory.getVessel(req.params.slug);
        if (!result) return next(new AppError('NOT_FOUND', `No vessel with slug '${req.params.slug}'`, 404));
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const getStats = async (req, res, next) => {
    try { return sendSuccess(req, res, await directory.getStats()); } catch (err) { return next(err); }
};

const getRankings = async (req, res, next) => {
    try { return sendSuccess(req, res, await directory.getRankings()); } catch (err) { return next(err); }
};

const listCountries = async (req, res, next) => {
    try { return sendSuccess(req, res, await directory.listCountries()); } catch (err) { return next(err); }
};

const getCountry = async (req, res, next) => {
    try {
        const result = await directory.getCountry(req.params.code);
        if (!result) return next(new AppError('NOT_FOUND', `No shipping companies registered in '${req.params.code}'`, 404));
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

/**
 * Slug + last-modified for the sitemap generator.
 *
 * Paged rather than returned whole: the vessel table alone is ~96k rows, and both the
 * sitemap spec's 50,000-URL ceiling and the memory cost of one array make chunking the
 * only correct shape. `kind` is validated against a fixed set — it selects a query, so
 * accepting an arbitrary string here would be handing the caller a table name.
 */
const listSitemap = async (req, res, next) => {
    try {
        const kind = String(req.params.kind || '');
        if (kind !== 'companies' && kind !== 'vessels') {
            return next(new AppError('BAD_REQUEST', "kind must be 'companies' or 'vessels'", 400));
        }
        const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50000, 50000);
        const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
        const [data, total] = await Promise.all([
            directory.listSitemapEntries(kind, { limit, offset }),
            directory.countSitemapEntries(kind),
        ]);
        return sendSuccess(req, res, { data, total, limit, offset });
    } catch (err) { return next(err); }
};

/**
 * A shipbuilder or flag-state hub. `dimension` comes from the route, not the client, and
 * is validated in the service — it selects a query.
 */
const getCohort = async (req, res, next) => {
    try {
        const { dimension, slug } = req.params;
        const result = await directory.getCohort(dimension, slug, req.query);
        if (!result) return next(new AppError('NOT_FOUND', `No ${dimension} with slug '${slug}'`, 404));
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

/** Flag x type — its slug is two path segments, recombined here. */
const getCrossCohort = async (req, res, next) => {
    try {
        const slug = `${req.params.flag}/${req.params.type}`;
        const result = await directory.getCohort('flag_type', slug, req.query);
        if (!result) return next(new AppError('NOT_FOUND', `No flag/type combination '${slug}'`, 404));
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const listCohorts = async (req, res, next) => {
    try { return sendSuccess(req, res, await directory.listCohorts(req.params.dimension)); }
    catch (err) { return next(err); }
};

module.exports = {
    listCompanies, getCompany, listCompanyVessels, getCohort, getCrossCohort, listCohorts,
    listShips, getShip, getStats, getRankings, listCountries, getCountry, listSitemap,
};
