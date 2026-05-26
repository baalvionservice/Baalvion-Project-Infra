'use strict';
const countries = require('../data/countries');
const departments = require('../data/departments');
const compliance = require('../data/compliance');
const { getRolesByCountry } = require('../data/roles');

// ─── Countries ────────────────────────────────────────────────────────────────

exports.listCountries = (req, res) => {
    let result = countries;
    if (req.query.isActive === 'true')  result = result.filter(c => c.isActive);
    if (req.query.isActive === 'false') result = result.filter(c => !c.isActive);
    return res.json({ success: true, data: result.sort((a, b) => a.displayOrder - b.displayOrder) });
};

exports.getCountryBySlug = (req, res) => {
    const country = countries.find(c => c.slug === req.params.slug);
    if (!country) return res.status(404).json({ success: false, error: { message: 'Country not found' } });
    return res.json({ success: true, data: country });
};

// ─── Departments ──────────────────────────────────────────────────────────────

exports.listDepartments = (req, res) => {
    let result = departments;
    if (req.query.isActive === 'true')  result = result.filter(d => d.isActive);
    if (req.query.countryId)            result = result.filter(d => d.supportedCountryIds.includes(req.query.countryId));
    return res.json({ success: true, data: result.sort((a, b) => a.displayOrder - b.displayOrder) });
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
