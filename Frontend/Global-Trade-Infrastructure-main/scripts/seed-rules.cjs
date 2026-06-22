/**
 * @file scripts/seed-rules.cjs
 * @description Provision the platform-global Rule Engine baseline (organizationId
 * NULL) as DATA. This is the explicit replacement for the business logic that was
 * previously hardcoded in TypeScript:
 *   - server/compliance/compliance-engine.ts  SANCTIONED_COUNTRIES / HIGH_RISK_COUNTRIES / PEP_NAMES / AML_THRESHOLD
 *   - services/governance-service.ts          restricted country codes + "Defense" category checks
 *
 * Idempotent: re-running replaces each global set's rules in place. Runs as the
 * privileged DATABASE_URL role (RLS-bypassing) so it can write NULL-org rows.
 *
 *   node scripts/seed-rules.cjs
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Each entry is one global rule set + its rules, expressed entirely as data. */
const SETS = [
  {
    key: 'sanctions.screening',
    name: 'Global Sanctions & Watchlist Screening',
    description: 'Comprehensive sanctions, high-risk jurisdiction, sanctioned-entity and PEP screening.',
    category: 'SANCTIONS',
    conflictStrategy: 'DENY_OVERRIDES',
    defaultDecision: 'ALLOW',
    priority: 100,
    rules: [
      {
        key: 'sanctioned-destination',
        name: 'Comprehensively sanctioned destination',
        priority: 100,
        condition: { fact: 'destinationCountry', op: 'in', value: ['IR', 'KP', 'SY', 'CU', 'RU'], caseInsensitive: true },
        effect: { type: 'DENY', message: 'Destination is under comprehensive sanctions' },
      },
      {
        key: 'sanctioned-origin',
        name: 'Comprehensively sanctioned origin',
        priority: 100,
        condition: { fact: 'originCountry', op: 'in', value: ['IR', 'KP', 'SY', 'CU', 'RU'], caseInsensitive: true },
        effect: { type: 'DENY', message: 'Origin is under comprehensive sanctions' },
      },
      {
        key: 'high-risk-jurisdiction',
        name: 'High-risk jurisdiction — manual review',
        priority: 60,
        condition: {
          any: [
            { fact: 'destinationCountry', op: 'in', value: ['AF', 'YE', 'SS', 'VE', 'MM'], caseInsensitive: true },
            { fact: 'originCountry', op: 'in', value: ['AF', 'YE', 'SS', 'VE', 'MM'], caseInsensitive: true },
          ],
        },
        effect: { type: 'REVIEW', message: 'High-risk jurisdiction requires enhanced due diligence' },
      },
      {
        key: 'sanctioned-entity-name',
        name: 'Counterparty matches a sanctioned-entity name',
        priority: 90,
        condition: {
          fact: 'counterpartyName',
          op: 'in',
          value: ['darkstar holdings', 'redline logistics', 'sanctioned co'],
          caseInsensitive: true,
        },
        effect: { type: 'DENY', message: 'Counterparty appears on a sanctioned-entity list' },
      },
      {
        key: 'pep-name',
        name: 'Counterparty matches a politically-exposed person',
        priority: 70,
        condition: {
          fact: 'counterpartyName',
          op: 'in',
          value: ['ivan petrov', 'general okonkwo', 'minister zhao'],
          caseInsensitive: true,
        },
        effect: { type: 'REVIEW', message: 'Politically-exposed person — enhanced due diligence required' },
      },
    ],
  },
  {
    key: 'aml.thresholds',
    name: 'AML Monetary Thresholds',
    description: 'Anti-money-laundering reporting and high-value review thresholds.',
    category: 'AML',
    conflictStrategy: 'DENY_OVERRIDES',
    defaultDecision: 'ALLOW',
    priority: 80,
    rules: [
      {
        key: 'aml-reporting-threshold',
        name: 'AML reporting threshold',
        priority: 50,
        condition: { fact: 'amount', op: 'gte', value: 500000 },
        effect: [
          { type: 'REVIEW', message: 'Transaction exceeds the AML reporting threshold' },
          { type: 'REQUIRE_REPORT', params: { report: 'CTR' }, message: 'File a currency transaction report' },
        ],
      },
      {
        key: 'high-value-review',
        name: 'High-value transaction review',
        priority: 60,
        condition: { fact: 'amount', op: 'gte', value: 1000000 },
        effect: { type: 'REVIEW', message: 'High-value transaction requires senior approval' },
      },
    ],
  },
  {
    key: 'export.licensing',
    name: 'Export Control & Licensing',
    description: 'Dual-use / defense product export controls and destination restrictions.',
    category: 'LICENSING',
    conflictStrategy: 'DENY_OVERRIDES',
    defaultDecision: 'ALLOW',
    priority: 70,
    rules: [
      {
        key: 'defense-category-license',
        name: 'Defense / weapon category requires an export licence',
        priority: 50,
        direction: 'EXPORT',
        condition: {
          any: [
            { fact: 'productCategory', op: 'eq', value: 'Defense', caseInsensitive: true },
            { fact: 'commodity', op: 'contains', value: 'weapon', caseInsensitive: true },
          ],
        },
        effect: [
          { type: 'REVIEW', message: 'Defense-controlled goods require review' },
          { type: 'REQUIRE_LICENSE', params: { license: 'EXPORT_CONTROL' }, message: 'Export control licence required' },
        ],
      },
      {
        key: 'defense-to-restricted-destination',
        name: 'Defense goods to a restricted destination are prohibited',
        priority: 100,
        direction: 'EXPORT',
        condition: {
          all: [
            { fact: 'productCategory', op: 'eq', value: 'Defense', caseInsensitive: true },
            { fact: 'destinationCountry', op: 'in', value: ['RU', 'IR', 'KP'], caseInsensitive: true },
          ],
        },
        effect: { type: 'DENY', message: 'Defense exports to this destination are prohibited' },
      },
    ],
  },
];

async function seedSet(def) {
  // Replace-in-place for idempotency: drop the existing global set (rules cascade).
  const existing = await prisma.ruleSet.findFirst({ where: { key: def.key, organizationId: null, deletedAt: null } });
  if (existing) {
    await prisma.ruleSet.delete({ where: { id: existing.id } });
  }
  const set = await prisma.ruleSet.create({
    data: {
      organizationId: null,
      key: def.key,
      name: def.name,
      description: def.description,
      category: def.category,
      conflictStrategy: def.conflictStrategy,
      defaultDecision: def.defaultDecision,
      priority: def.priority ?? 0,
      status: 'ACTIVE',
    },
  });
  for (const r of def.rules) {
    await prisma.rule.create({
      data: {
        ruleSetId: set.id,
        organizationId: null,
        key: r.key,
        name: r.name,
        priority: r.priority ?? 0,
        status: 'ACTIVE',
        direction: r.direction ?? 'BOTH',
        condition: r.condition,
        effect: r.effect,
        tags: r.tags ?? [],
      },
    });
  }
  return { key: def.key, rules: def.rules.length };
}

(async () => {
  console.log('[seed-rules] provisioning platform-global rule baseline…');
  for (const def of SETS) {
    const res = await seedSet(def);
    console.log(`[seed-rules]   ${res.key}: ${res.rules} rules`);
  }
  console.log('[seed-rules] done.');
  await prisma.$disconnect();
})().catch(async (err) => {
  console.error('[seed-rules] FAILED:', err);
  await prisma.$disconnect();
  process.exit(1);
});
