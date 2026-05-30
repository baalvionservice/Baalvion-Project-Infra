/* Seed glossary terms (type='term') into imperialpedia.entities from the JSON extracted by
   the frontend's scripts/extract-terms.ts. attributes = the full frontend Term. Idempotent.
   Run with inline DB env (dotenv is cwd-relative). */
const path = require('path');
const db = require('../models');
const rows = require(path.join(__dirname, '_terms_entities.json'));

async function main() {
  await db.sequelize.authenticate();
  await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
  await db.sequelize.sync();
  let n = 0;
  for (const r of rows) {
    const base = {
      type: r.type, name: r.name, slug: r.slug,
      description: r.description || '', category: r.category || 'Glossary',
      country: null, industry: null, image: r.image || null,
      tags: r.tags || [], attributes: r.attributes || {},
    };
    const [row, created] = await db.Entity.findOrCreate({ where: { type: r.type, slug: r.slug }, defaults: base });
    if (!created) await row.update(base);
    n++;
  }
  console.log(JSON.stringify({ ok: true, seeded: n }));
  process.exit(0);
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
