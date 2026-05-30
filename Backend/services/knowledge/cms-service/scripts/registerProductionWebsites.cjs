'use strict';
/**
 * Registers the REAL Baalvion production websites as CMS tenants (cms.cms_websites).
 *
 * Multi-tenant model: shared `cms` schema, every content row is scoped by website_id;
 * per-site users/permissions live in cms.cms_website_members; per-site branding/visibility
 * live in each website's branding/config JSONB. All sites are owned by the platform org.
 *
 * Idempotent: ON CONFLICT (slug) updates the mutable fields. Re-run any time.
 *
 *   ORG_ID  = platform super-admin org   (override: CMS_ORG_ID)
 *   CREATED_BY = platform super-admin id  (override: CMS_CREATED_BY)
 *
 * `config.linked*` records the existing frontend/backend/schema each site maps to.
 * `config.mappingConfirmed=false` flags the rows still pending the user's confirmation.
 */
const { Client } = require('pg');

const ORG_ID     = process.env.CMS_ORG_ID     || '52c76e5c-0668-4492-ba20-23e7ee16f49b';
const CREATED_BY = Number(process.env.CMS_CREATED_BY || 67);

// domain, name, slug, plan, modules, linkedFrontend, linkedService, linkedSchema, confirmed
const SITES = [
  ['amarisemaisonavenue.com', 'Amarise Maison Avenue', 'amarise-maison-avenue', 'enterprise', ['pages','portfolio_item','news'], 'AmariseMaisonAvenue-main', 'real-estate-service', 'real_estate', true],
  ['imperialpedia.com',       'Imperialpedia',          'imperialpedia',         'enterprise', ['pages','article','doc'],       'Imperialpedia-main',      'imperialpedia-service','imperialpedia', true],
  ['lawelitenetwork.com',     'Law Elite Network',      'law-elite-network',     'enterprise', ['pages','article','news'],      'Law-Elite-Network-main',  'law-service',          'legal',  true],
  ['controlthemarket.com',    'Control The Market',     'control-the-market',    'enterprise', ['pages','post','news'],         'controlthemarket-main',   'ctm-service',          'ctm',    true],
  ['mining.baalvion.com',     'Baalvion Mining',        'baalvion-mining',       'enterprise', ['pages','news'],                'Mining.Baalvion-main',    'mining-service',       'mining', true],
  ['jobs.baalvion.com',       'Baalvion Jobs',          'baalvion-jobs',         'enterprise', ['pages','job_listing'],         'Baalvion-Jobs-Portal-main','jobs-service',        'jobs',   true],
  ['ir.baalvion.com',         'Baalvion Investor Relations','baalvion-ir',       'enterprise', ['pages','news','doc'],          'IR-Baalvion-main',        'ir-service',           'ir',     true],
  ['dashboard.baalvion.com',  'Baalvion Dashboard',     'baalvion-dashboard',    'enterprise', ['pages'],                       'company-unified-Dashboard-main','dashboard-service','dashboard', true],
  ['connect.baalvion.com',    'Baalvion Connect',       'baalvion-connect',      'enterprise', ['pages','post'],                'brand-connector-main',    'brand-connector-service','brand', true],
  ['about.baalvion.com',      'About Baalvion',         'about-baalvion',        'enterprise', ['pages','news'],                'about-baalvion-main',     'about-service',        'about',  true],
  ['proxy.baalvionstack.com', 'Proxy by BaalvionStack', 'proxy-baalvionstack',   'enterprise', ['pages','doc'],                 'Proxy-BaalvionStack',     'proxy-service',        'os',     true],
  // ── pending user confirmation (best guess) ──
  ['baalvion.com',            'Baalvion',               'baalvion',              'enterprise', ['pages','news'],                'about-baalvion-main',     'about-service',        'about',  false],
  ['baalvionstack.com',       'BaalvionStack',          'baalvionstack',         'enterprise', ['pages'],                       'Proxy-BaalvionStack',     'proxy-service',        'os',     false],
  ['baalviongroup.com',       'Baalvion Group',         'baalvion-group',        'enterprise', ['pages','news'],                'For Invstors and Founders','insiders-service',    'insiders', false],
  ['marketunderworld.com',    'Market Underworld',      'market-underworld',     'enterprise', ['pages','product','news'],      'Global-Trade-Infrastructure-main','trade-service', 'trade',  false],
  ['market.baalvion.com',     'Baalvion Market',        'baalvion-market',       'enterprise', ['pages','product'],             'Global-Trade-Infrastructure-main','market-service','market', false],
  ['shop.baalvionstack.com',  'BaalvionStack Shop',     'baalvionstack-shop',    'enterprise', ['pages','product'],             null,                      'commerce-service',     'commerce', false],
];

async function main() {
  const c = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'baalvion_db',
    user: process.env.DB_USER || 'baalvion',
    password: process.env.DB_PASSWORD || 'baalvion_dev_pass',
  });
  await c.connect();
  let created = 0, updated = 0;
  try {
    for (const [domain, name, slug, plan, modules, fe, svc, schema, confirmed] of SITES) {
      const config = {
        timezone: 'UTC', defaultLanguage: 'en', enableAnalytics: true,
        linkedFrontend: fe, linkedService: svc, linkedSchema: schema, mappingConfirmed: confirmed,
      };
      const branding = { primaryColor: '#0B1F3A', displayName: name };
      const res = await c.query(
        `INSERT INTO cms.cms_websites (organization_id, name, slug, domain, status, plan, modules, config, branding, created_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4,'active',$5,$6,$7,$8,$9,NOW(),NOW())
         ON CONFLICT (slug) DO UPDATE
            SET name=EXCLUDED.name, domain=EXCLUDED.domain, plan=EXCLUDED.plan,
                modules=EXCLUDED.modules, config=EXCLUDED.config, updated_at=NOW()
         RETURNING (xmax = 0) AS inserted`,
        [ORG_ID, name, slug, domain, plan, JSON.stringify(modules), JSON.stringify(config), JSON.stringify(branding), CREATED_BY]
      );
      res.rows[0].inserted ? created++ : updated++;
    }
    console.log(JSON.stringify({ ok: true, total: SITES.length, created, updated }, null, 2));
  } finally {
    await c.end();
  }
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
