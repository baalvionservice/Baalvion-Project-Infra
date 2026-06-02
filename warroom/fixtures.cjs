'use strict';
/**
 * Shared, portable fixtures for the war-room E2E harnesses.
 *
 * Reads warroom/beta-fixtures.json (emitted by bootstrap) so the harnesses run against
 * whatever a fresh bootstrap seeded — product IDs are random per seed, so hard-coding one
 * breaks on a re-seed. Falls back to the original constants when no fixtures file exists
 * (preserves the previously-verified run on the current volume).
 */
const fs = require('fs');
const path = require('path');

const FIXTURE_FILE = path.join(__dirname, 'beta-fixtures.json');

const DEFAULTS = {
  store: 'a0a00000-0000-4000-8000-000000000001',
  product: 'ec572c4a-4745-4679-8edd-493ee557a2c5',
  customer: 'c0000000-0000-4000-8000-000000000001',
  customerUserId: '9000001',
  shopperUserId: '9000002',
  opsUserId: '9000099',
  viewerUserId: '9000088',
  adminUserId: '9000099',
  paymentSite: 'baalvion-mining',
  paymentWebhookSecret: 'rzp_whsec_mining_e2e',
  crossTenantSite: 'baalvionstack-shop',
};

function load() {
  let fromFile = {};
  try {
    if (fs.existsSync(FIXTURE_FILE)) {
      fromFile = JSON.parse(fs.readFileSync(FIXTURE_FILE, 'utf8')) || {};
    }
  } catch {
    /* corrupt/partial file → fall back to defaults */
  }
  return { ...DEFAULTS, ...fromFile };
}

module.exports = load();
module.exports.FIXTURE_FILE = FIXTURE_FILE;
