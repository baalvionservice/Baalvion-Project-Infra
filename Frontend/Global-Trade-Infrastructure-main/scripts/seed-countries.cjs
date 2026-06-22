/**
 * @file scripts/seed-countries.cjs
 * @description Provision the platform-global Country Knowledge Base baseline
 * (organizationId NULL) for the GCKB — countries, currencies, authorities, ports,
 * trade agreements and the policy long tail (taxes, tariffs incl. FTA-preferential
 * lines, duties, licenses, certificates, restrictions, documents, digital APIs).
 * This is what makes the public portal (/countries, /tariffs, /fta, /ports,
 * /authorities, /compare) render real data and the duty calculator return real
 * estimates.
 *
 * Single source of truth: src/server/gckb/seed-data.json — shared with the seed
 * integration test (registry validation) so the production seed and the tested
 * data can never drift.
 *
 * Each record is written PUBLISHED with a v1 append-only revision and a content
 * checksum identical to the one the GCKB service computes (so a later service-side
 * edit correctly detects a no-op). Idempotent: re-running updates changed records
 * in place (bumping the version + writing a new revision) and skips unchanged ones.
 * Runs as the privileged DATABASE_URL role (RLS-bypassing) so it can write
 * NULL-org rows.
 *
 *   node scripts/seed-countries.cjs
 */
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');
const data = require('../src/server/gckb/seed-data.json');

const prisma = new PrismaClient();

// ── Checksum (mirror of src/server/gckb/checksum.ts — must stay identical) ────
function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}
function recordChecksum(input) {
  const content = {
    entityType: input.entityType,
    recordKey: input.recordKey,
    name: input.name,
    attributes: input.attributes || {},
    code: input.code ?? null,
    policyType: input.policyType ?? null,
    hsCode: input.hsCode ?? null,
    productCategory: input.productCategory ?? null,
    tags: [...(input.tags || [])].sort(),
    countryCode: input.countryCode ?? null,
  };
  return createHash('sha256').update(JSON.stringify(sortValue(content))).digest('hex');
}

// ── Natural-key derivation (mirror of the GCKB registry) ─────────────────────
function deriveKey(entityType, item) {
  const cc = item.countryCode ? String(item.countryCode).toUpperCase() : '';
  const code = item.code ? String(item.code) : '';
  switch (entityType) {
    case 'country':
    case 'currency':
    case 'trade_agreement':
      return code.toUpperCase();
    case 'authority':
      return `${cc ? `${cc}:` : ''}authority:${code}`;
    case 'point_of_entry':
      return `${cc}:poe:${code}`;
    case 'country_policy':
      return `${cc}:${item.policyType}:${code}`;
    default:
      return code.toUpperCase();
  }
}

/** Normalise a dataset row into the GCKB write shape for one entity type. */
function toWrite(entityType, item) {
  const recordKey = deriveKey(entityType, item);
  return {
    entityType,
    recordKey,
    name: item.name,
    attributes: item.attributes || {},
    code: item.code ?? null,
    policyType: item.policyType ?? null,
    hsCode: item.hsCode ?? null,
    productCategory: null,
    tags: [],
    countryCode: item.countryCode ?? null,
  };
}

const stats = { created: 0, updated: 0, unchanged: 0 };

async function upsertRecord(write, countryIdByCode) {
  const checksum = recordChecksum(write);
  const countryId = write.countryCode ? countryIdByCode.get(String(write.countryCode).toUpperCase()) ?? null : null;

  const existing = await prisma.gckbRecord.findFirst({
    where: { entityType: write.entityType, recordKey: write.recordKey, organizationId: null, deletedAt: null },
  });

  if (existing && existing.checksum === checksum && existing.status === 'PUBLISHED') {
    stats.unchanged += 1;
    return existing;
  }

  const base = {
    organizationId: null,
    entityType: write.entityType,
    recordKey: write.recordKey,
    name: write.name,
    countryId,
    parentId: null,
    code: write.code,
    policyType: write.policyType,
    hsCode: write.hsCode,
    productCategory: write.productCategory,
    attributes: write.attributes,
    tags: write.tags,
    status: 'PUBLISHED',
    publishedAt: new Date(),
    source: 'seed:gckb-baseline',
    checksum,
  };

  let record;
  let action;
  if (!existing) {
    record = await prisma.gckbRecord.create({ data: { ...base, version: 1 } });
    action = 'CREATE';
    stats.created += 1;
  } else {
    record = await prisma.gckbRecord.update({ where: { id: existing.id }, data: { ...base, version: existing.version + 1 } });
    action = 'UPDATE';
    stats.updated += 1;
  }

  await prisma.gckbRevision.create({
    data: {
      organizationId: null,
      recordId: record.id,
      entityType: record.entityType,
      recordKey: record.recordKey,
      version: record.version,
      action,
      snapshot: JSON.parse(JSON.stringify(record)),
      checksum: record.checksum,
      actorId: 'seed:gckb-baseline',
      actorRole: 'PLATFORM_ADMIN',
      source: 'seed:gckb-baseline',
      reason: 'GCKB country baseline seed',
    },
  });

  return record;
}

async function main() {
  console.log('Seeding GCKB country baseline (organizationId NULL)…');

  // 1) Countries first, so country-scoped records can resolve their FK.
  const countryIdByCode = new Map();
  for (const item of data.countries) {
    const record = await upsertRecord(toWrite('country', item), countryIdByCode);
    countryIdByCode.set(record.recordKey.toUpperCase(), record.id);
  }

  // 2) Everything else (order within these is irrelevant).
  const sections = [
    ['currency', data.currencies],
    ['authority', data.authorities],
    ['point_of_entry', data.ports],
    ['trade_agreement', data.agreements],
    ['country_policy', data.policies],
  ];
  for (const [entityType, items] of sections) {
    for (const item of items || []) {
      await upsertRecord(toWrite(entityType, item), countryIdByCode);
    }
  }

  console.log(`Done. created=${stats.created} updated=${stats.updated} unchanged=${stats.unchanged}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
