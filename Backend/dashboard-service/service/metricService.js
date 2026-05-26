'use strict';
const { Op } = require('sequelize');
const db = require('../models');

const getSnapshots = async (orgId, { metric_name, limit }) => {
    const where = { org_id: orgId };
    if (metric_name) where.metric_name = metric_name;
    return db.MetricSnapshot.findAll({
        where,
        order: [['captured_at', 'DESC']],
        limit,
    });
};

const pushMetric = async (orgId, data) => {
    return db.MetricSnapshot.create({ ...data, org_id: orgId });
};

module.exports = { getSnapshots, pushMetric };
