'use strict';
const db = require('../models');
const { getPlaceBySlug, metroFor, PLACES } = require('../data/locations');
const countries = require('../data/countries');
const departments = require('../data/departments');
const compliance = require('../data/compliance');
const { getRolesByCountry } = require('../data/roles');

// ─── Countries ────────────────────────────────────────────────────────────────

/**
 * Every country by default — a recruiter must be able to post in a town anywhere and a
 * candidate to apply from anywhere. `?hub=true` narrows to the nine countries that have
 * editorial pages, which is what the "our hiring regions" surfaces want.
 */
exports.listCountries = (req, res) => {
    let result = countries;
    if (req.query.hub === 'true')       result = result.filter(c => c.isHub);
    if (req.query.hub === 'false')      result = result.filter(c => !c.isHub);
    if (req.query.isActive === 'true')  result = result.filter(c => c.isActive);
    if (req.query.isActive === 'false') result = result.filter(c => !c.isActive);
    if (req.query.q) {
        const q = String(req.query.q).toLowerCase();
        result = result.filter(c => c.name.toLowerCase().includes(q) || c.isoCode.toLowerCase() === q);
    }
    const sorted = [...result].sort((a, b) => (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name));
    return res.json({ success: true, data: sorted });
};

exports.getCountryBySlug = (req, res) => {
    const country = countries.find(c => c.slug === req.params.slug);
    if (!country) return res.status(404).json({ success: false, error: { message: 'Country not found' } });
    return res.json({ success: true, data: country });
};

// ─── Departments ──────────────────────────────────────────────────────────────

/**
 * `supportedCountryIds` records where a department has an established presence — it is a
 * hint, not a fence. Filtering by a country nobody has been hired in yet would leave a
 * recruiter posting there with an empty dropdown, so an unrecognised country falls back
 * to the full list rather than to nothing.
 */
exports.listDepartments = (req, res) => {
    let result = departments;
    if (req.query.isActive === 'true') result = result.filter(d => d.isActive);
    if (req.query.countryId) {
        const scoped = result.filter(d => d.supportedCountryIds.includes(req.query.countryId));
        if (scoped.length) result = scoped;
    }
    const sorted = [...result].sort((a, b) => a.displayOrder - b.displayOrder);
    return res.json({ success: true, data: sorted });
};

// ─── Compliance ───────────────────────────────────────────────────────────────

exports.getComplianceProfile = (req, res) => {
    const profile = compliance.find(p => p.id === req.params.id);
    if (!profile) return res.status(404).json({ success: false, error: { message: 'Compliance profile not found' } });
    return res.json({ success: true, data: profile });
};

// ─── Roles ────────────────────────────────────────────────────────────────────

exports.listRolesByCountry = (req, res) => {
    const roles = getRolesByCountry(req.params.countrySlug);
    return res.json({ success: true, data: roles });
};

// ─── Locations ────────────────────────────────────────────────────────────────

/**
 * Places that currently have published roles, with counts.
 *
 * Driven entirely by real listings: a place appears here only once something is open
 * there. That is what keeps the location landing pages off the "indexed but empty"
 * pile — the site never offers Google a page for a town it has nothing to say about.
 */
exports.listJobLocations = async (req, res, next) => {
    try {
        const rows = await db.JobListing.findAll({
            where: { status: 'published' },
            attributes: [
                'place_slug',
                'metro_slug',
                'city',
                'country_id',
                [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'job_count'],
            ],
            group: ['place_slug', 'metro_slug', 'city', 'country_id'],
            raw: true,
        });

        const places = new Map();
        const bump = (slug, count, fallbackName, countryId) => {
            if (!slug) return;
            const known = getPlaceBySlug(slug);
            const existing = places.get(slug);
            if (existing) { existing.jobCount += count; return; }
            const metro = known ? metroFor(known) : null;
            places.set(slug, {
                slug,
                name: known ? known.name : fallbackName,
                type: known ? known.type : 'city',
                state: known ? known.state : null,
                countryId: known ? known.countryId : countryId,
                parentSlug: known && known.parentSlug ? known.parentSlug : null,
                parentName: metro && metro.slug !== slug ? metro.name : null,
                jobCount: count,
            });
        };

        for (const row of rows) {
            const count = Number(row.job_count) || 0;
            // The town itself…
            bump(row.place_slug, count, row.city, row.country_id);
            // …the metro it belongs to, which aggregates all of its suburbs…
            if (row.metro_slug && row.metro_slug !== row.place_slug) {
                bump(row.metro_slug, count, null, row.country_id);
            }
            // …and the country, so "jobs in India" is a real page. Remote roles resolve
            // to no town at all and would otherwise be reachable from nowhere.
            const country = countries.find((c) => c.id === row.country_id);
            if (country) {
                const existing = places.get(country.slug);
                if (existing) existing.jobCount += count;
                else places.set(country.slug, {
                    slug: country.slug,
                    name: country.name,
                    type: 'country',
                    state: null,
                    countryId: country.id,
                    parentSlug: null,
                    parentName: null,
                    jobCount: count,
                });
            }
        }

        const items = [...places.values()]
            .filter((p) => p.name && p.jobCount > 0)
            .sort((a, b) => b.jobCount - a.jobCount || a.name.localeCompare(b.name));

        return res.json({ success: true, data: items });
    } catch (err) { return next(err); }
};

/** One place, plus its sibling suburbs that also have roles — for internal linking. */
exports.getJobLocation = async (req, res, next) => {
    try {
        const place = getPlaceBySlug(req.params.slug);

        // Not a town — try a country. Remote roles belong to a country and no town, so
        // without this their location page (and their own URL's parent) is a dead end.
        if (!place) {
            const country = countries.find((c) => c.slug === req.params.slug);
            if (!country) return res.status(404).json({ success: false, error: { message: 'Location not found' } });
            return res.json({
                success: true,
                data: {
                    slug: country.slug,
                    name: country.name,
                    type: 'country',
                    state: null,
                    countryId: country.id,
                    metroSlug: null,
                    metroName: null,
                    siblings: [],
                },
            });
        }
        const metro = metroFor(place);
        const siblings = PLACES.filter(
            (p) => p.type === 'locality' && metro && p.parentSlug === metro.slug && p.slug !== place.slug,
        ).map((p) => ({ slug: p.slug, name: p.name }));
        return res.json({
            success: true,
            data: {
                slug: place.slug,
                name: place.name,
                type: place.type,
                state: place.state,
                countryId: place.countryId,
                metroSlug: metro ? metro.slug : null,
                metroName: metro && metro.slug !== place.slug ? metro.name : null,
                siblings,
            },
        });
    } catch (err) { return next(err); }
};

// ─── Job facets ───────────────────────────────────────────────────────────────

/**
 * Filter options for the search page, with live counts.
 *
 * Built from published listings rather than from a fixed list, so a filter never offers
 * a choice that returns nothing — the commonest way a faceted search wastes someone's
 * time. Counts are of the whole published set; they tell a visitor where the roles are
 * before they click.
 */
exports.listJobFacets = async (req, res, next) => {
    try {
        const departments = require('../data/departments');
        const rows = await db.JobListing.findAll({
            where: { status: 'published' },
            attributes: ['department_id', 'country_id', 'metro_slug', 'city', 'job_type', 'experience_level', 'remote_allowed'],
            raw: true,
        });

        const tally = (key) => {
            const counts = new Map();
            for (const row of rows) {
                const value = row[key];
                if (!value) continue;
                counts.set(value, (counts.get(value) || 0) + 1);
            }
            return counts;
        };

        const nameFor = (list, id, field = 'name') => (list.find((x) => x.id === id) || {})[field] || id;

        const toOptions = (counts, label) =>
            [...counts.entries()]
                .map(([value, count]) => ({ value, label: label(value), count }))
                .filter((o) => o.label)
                .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

        const EMPLOYMENT_LABEL = {
            full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship',
        };
        const LEVEL_LABEL = { entry: 'Entry', mid: 'Mid', senior: 'Senior', lead: 'Lead / Principal' };

        return res.json({
            success: true,
            data: {
                department: toOptions(tally('department_id'), (id) => nameFor(departments, id)),
                country:    toOptions(tally('country_id'), (id) => nameFor(countries, id)),
                metro:      toOptions(tally('metro_slug'), (slug) => {
                    const place = getPlaceBySlug(slug);
                    return place ? place.name : null;
                }),
                employmentType: toOptions(tally('job_type'), (v) => EMPLOYMENT_LABEL[v] || v),
                level:          toOptions(tally('experience_level'), (v) => LEVEL_LABEL[v] || v),
                remote: [{
                    value: 'true',
                    label: 'Open to remote',
                    count: rows.filter((r) => r.remote_allowed).length,
                }].filter((o) => o.count > 0),
                total: rows.length,
            },
        });
    } catch (err) { return next(err); }
};
